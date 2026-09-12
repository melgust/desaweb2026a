"""Integration checks against the running MySQL API. Removes only records it creates.

Run: python backend/tests/api_smoke.py
Optional: API_URL, TEST_ADMIN_EMAIL, TEST_ADMIN_PASSWORD environment variables.
"""
import copy
import json
import os
import uuid
from decimal import Decimal
from urllib.error import HTTPError
from urllib.request import Request, urlopen

BASE = os.environ.get('API_URL', 'http://localhost:5000/api')
TOKEN = None
checks = 0


def call(method, path, body=None, expected=200, authenticated=True):
    global checks
    headers = {'Content-Type': 'application/json'}
    if authenticated and TOKEN:
        headers['Authorization'] = 'Bearer ' + TOKEN
    request = Request(BASE + path, data=json.dumps(body).encode() if body is not None else None,
                      headers=headers, method=method)
    try:
        response = urlopen(request, timeout=20)
    except HTTPError as error:
        response = error
    data = response.read().decode()
    assert response.status == expected, (method, path, response.status, expected, data)
    checks += 1
    return json.loads(data, parse_float=Decimal) if data else None


def run():
    global TOKEN
    supplier_id = product_id = invoice_id = None
    suffix = uuid.uuid4().hex
    try:
        call('GET', '/invoices', expected=401, authenticated=False)
        call('POST', '/auth/login', {'email': 'missing@example.com', 'password': 'invalid'}, expected=401)
        TOKEN = call('POST', '/auth/login', {
            'email': os.environ.get('TEST_ADMIN_EMAIL', 'admin@enterprise.com'),
            'password': os.environ.get('TEST_ADMIN_PASSWORD', 'Admin123!')})['token']
        call('GET', '/categories/all')
        call('GET', '/products/all')
        call('GET', '/suppliers/all')
        call('GET', '/suppliers?page=0', expected=400)
        call('GET', '/invoices/' + str(uuid.uuid4()), expected=404)
        call('GET', '/suppliers/' + str(uuid.uuid4()), expected=404)
        call('POST', '/suppliers', {'name': ' ', 'isActive': True}, expected=400)
        call('POST', '/suppliers', {'name': 'Invalid', 'contactEmail': 'not-an-email', 'isActive': True}, expected=400)
        supplier = {'name': 'Smoke ' + suffix, 'contactEmail': 'smoke@example.com', 'phone': '123', 'isActive': True}
        supplier_id = call('POST', '/suppliers', supplier, expected=201)['id']
        supplier['phone'] = '456'
        assert call('PUT', '/suppliers/' + supplier_id, supplier)['phone'] == '456'
        product = {'name': 'Smoke ' + suffix, 'price': 25.5, 'stock': 10, 'isActive': True, 'supplierId': supplier_id}
        product_id = call('POST', '/products', product, expected=201)['id']
        request = {'invoiceNumber': 'SMOKE-' + suffix, 'invoiceDate': '2026-09-11',
                   'supplierId': supplier_id, 'notes': 'Integration check',
                   'items': [{'productId': product_id, 'quantity': 3, 'unitPrice': 25.5},
                             {'productId': product_id, 'quantity': 2, 'unitPrice': 10}]}
        tampered = dict(request, subtotal=1, tax=100, total=1)
        invoice = call('POST', '/invoices', tampered, expected=201)
        invoice_id = invoice['id']
        assert invoice['subtotal'] == Decimal('96.5') and invoice['total'] == Decimal('96.5')
        assert invoice['tax'] == 0 and len(invoice['items']) == 2
        assert any(i['id'] == invoice_id for i in call('GET', '/invoices'))
        call('POST', '/invoices', request, expected=400)
        call('DELETE', '/suppliers/' + supplier_id, expected=400)
        call('DELETE', '/products/' + product_id, expected=400)
        product['price'] = 99
        call('PUT', '/products/' + product_id, product)
        assert call('GET', '/invoices/' + invoice_id)['total'] == Decimal('96.5')

        invalid_bodies = []
        for field, value in [('items', []), ('items', None), ('invoiceDate', 'invalid'),
                             ('invoiceDate', '0001-01-01'), ('supplierId', str(uuid.uuid4())),
                             ('invoiceNumber', ' '), ('notes', 'x' * 2001)]:
            invalid = copy.deepcopy(request)
            invalid[field] = value
            invalid_bodies.append(invalid)
        for field, value in [('productId', str(uuid.uuid4())), ('quantity', 0), ('quantity', -1),
                             ('unitPrice', -1), ('unitPrice', 1.001)]:
            invalid = copy.deepcopy(request)
            invalid['items'][1][field] = value
            invalid_bodies.append(invalid)
        for invalid in invalid_bodies:
            call('PUT', '/invoices/' + invoice_id, invalid, expected=400)
            unchanged = call('GET', '/invoices/' + invoice_id)
            assert unchanged['total'] == Decimal('96.5') and len(unchanged['items']) == 2
        invalid = copy.deepcopy(request)
        invalid['invoiceNumber'] += '-BAD'
        invalid['items'][1]['productId'] = str(uuid.uuid4())
        call('POST', '/invoices', invalid, expected=400)
        assert not any(i['invoiceNumber'] == invalid['invoiceNumber'] for i in call('GET', '/invoices'))

        request['items'] = [{'productId': product_id, 'quantity': 4, 'unitPrice': 0.1}]
        updated = call('PUT', '/invoices/' + invoice_id, request)
        assert updated['total'] == Decimal('0.4') and len(updated['items']) == 1
        supplier['isActive'] = False
        call('PUT', '/suppliers/' + supplier_id, supplier)
        assert call('GET', '/invoices/' + invoice_id)['supplierId'] == supplier_id
        call('PUT', '/invoices/' + invoice_id, request)

        admin_token = TOKEN
        TOKEN = call('POST', '/auth/login', {'email': 'user@enterprise.com', 'password': 'User123!'})['token']
        try:
            call('GET', '/invoices/' + invoice_id)
            call('POST', '/invoices', request, expected=403)
            call('PUT', '/invoices/' + invoice_id, request, expected=403)
            call('DELETE', '/invoices/' + invoice_id, expected=403)
            call('POST', '/suppliers', supplier, expected=403)
        finally:
            TOKEN = admin_token

        call('DELETE', '/invoices/' + invoice_id, expected=204)
        call('GET', '/invoices/' + invoice_id, expected=404)
        invoice_id = None
        call('DELETE', '/suppliers/' + supplier_id, expected=204)
        supplier_id = None
        assert call('GET', '/products/' + product_id)['supplierId'] is None
        print(f'PASS: {checks} HTTP assertions; totals, rollback, history, CRUD and roles verified.')
    finally:
        for resource, identifier in [('invoices', invoice_id), ('products', product_id), ('suppliers', supplier_id)]:
            if identifier:
                call('DELETE', f'/{resource}/{identifier}', expected=204)


if __name__ == '__main__':
    run()
