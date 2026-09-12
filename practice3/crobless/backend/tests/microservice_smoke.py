"""Additional cutover/security/concurrency checks; requires the local Compose stack."""
import base64
import concurrent.futures
import hashlib
import hmac
import json
import os
import time
import uuid
from decimal import Decimal
from urllib.request import Request, urlopen
from urllib.error import HTTPError

API = os.getenv('API_URL', 'http://localhost:5000')
PURCHASING = os.getenv('PURCHASING_URL', 'http://localhost:8081')
KEY = os.getenv('INTERNAL_SERVICE_KEY', 'crobless-local-internal-key-change-for-production-2026')
JWT_KEY = os.getenv('JWT_KEY', 'SUPER_SECRET_SECURITY_KEY_ENTERPRISE_APPLICATION_2026_JWT!')


def request(base, method, path, body=None, token=None, internal=False):
    headers = {'Content-Type': 'application/json'}
    if token:
        headers['Authorization'] = 'Bearer ' + token
    if internal:
        headers['X-Internal-Key'] = KEY
    req = Request(base + path, method=method, headers=headers,
                  data=json.dumps(body).encode() if body is not None else None)
    try:
        response = urlopen(req, timeout=30)
    except HTTPError as error:
        response = error
    body = response.read().decode()
    return response.status, json.loads(body, parse_float=Decimal) if body else None, response.headers


def signed(claims, secret=JWT_KEY):
    def encode(value):
        return base64.urlsafe_b64encode(json.dumps(value).encode()).rstrip(b'=')
    message = encode({'alg': 'HS256', 'typ': 'JWT'}) + b'.' + encode(claims)
    return (message + b'.' + base64.urlsafe_b64encode(hmac.new(secret.encode(), message, hashlib.sha256).digest()).rstrip(b'=')).decode()


def run():
    status, login, _ = request(API, 'POST', '/api/auth/login', {
        'email': os.getenv('TEST_ADMIN_EMAIL', 'admin@enterprise.com'),
        'password': os.getenv('TEST_ADMIN_PASSWORD', 'Admin123!')})
    assert status == 200
    token = login['token']
    for module in ('suppliers', 'invoices'):
        for method, suffix in [('GET', ''), ('POST', ''), ('GET', '/all'), ('PUT', '/' + str(uuid.uuid4())), ('DELETE', '/' + str(uuid.uuid4()))]:
            status, body, headers = request(API, method, '/api/' + module + suffix, token=token)
            assert status == 410, (method, module, status)
            assert headers['Deprecation'] and 'successor-version' in headers['Link']
    for base, path in [(API, '/internal/purchasing-export'), (PURCHASING, '/internal/suppliers')]:
        assert request(base, 'GET', path, token=token)[0] in (401, 403)
    claims = {'iss': 'EnterpriseApi', 'aud': 'EnterpriseApp', 'exp': int(time.time()) + 3600,
              'http://schemas.microsoft.com/ws/2008/06/identity/claims/role': 'User'}
    for changed, secret in [({'aud': 'wrong'}, JWT_KEY), ({'iss': 'wrong'}, JWT_KEY),
                            ({'exp': int(time.time()) - 600}, JWT_KEY), ({}, 'wrong-key-' * 8)]:
        assert request(PURCHASING, 'GET', '/api/invoices', token=signed(dict(claims, **changed), secret))[0] == 401
    assert request(PURCHASING, 'POST', '/api/suppliers', {'name': 'forbidden', 'isActive': True}, signed(claims))[0] == 403

    status, snapshot, _ = request(API, 'GET', '/internal/purchasing-export', internal=True)
    assert status == 200
    # Compare every remaining archived record, not just counts.
    for supplier in snapshot['suppliers']:
        status, actual, _ = request(PURCHASING, 'GET', '/api/suppliers/' + supplier['id'], token=token)
        assert status == 200
        for field in ('id', 'name', 'contactEmail', 'phone', 'isActive'):
            assert actual.get(field) == supplier.get(field), field
    for invoice in snapshot['invoices']:
        status, actual, _ = request(PURCHASING, 'GET', '/api/invoices/' + invoice['id'], token=token)
        assert status == 200
        for field in ('id', 'invoiceNumber', 'invoiceDate', 'supplierId', 'subtotal', 'tax', 'total', 'notes'):
            assert actual[field] == invoice[field], field
        assert sorted(actual['items'], key=lambda x: x['id']) == sorted(invoice['items'], key=lambda x: x['id'])
    print(f'PASS: 410 cutover, internal authentication, invalid JWTs, and full archive comparison ({len(snapshot["suppliers"])} suppliers, {len(snapshot["invoices"])} invoices).')

    for iteration in range(5):
        suffix = uuid.uuid4().hex
        sid = pid = iid = None
        try:
            status, supplier, _ = request(PURCHASING, 'POST', '/api/suppliers', {'name': 'Race ' + suffix, 'isActive': True}, token)
            assert status == 201
            sid = supplier['id']
            status, product, _ = request(API, 'POST', '/api/products', {'name': 'Race ' + suffix, 'supplierId': sid, 'price': 1, 'stock': 1, 'isActive': True}, token)
            assert status == 201
            pid = product['id']
            payload = {'invoiceNumber': 'RACE-' + suffix, 'invoiceDate': '2026-09-11', 'supplierId': sid,
                       'items': [{'productId': pid, 'quantity': 1, 'unitPrice': 1}]}
            with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
                creating = pool.submit(request, PURCHASING, 'POST', '/api/invoices', payload, token)
                deleting = pool.submit(request, API, 'DELETE', '/api/products/' + pid, None, token)
                created, deleted = creating.result(), deleting.result()
            assert created[0] in (201, 400, 409), created
            assert deleted[0] in (204, 400, 409, 503), deleted
            assert not (created[0] == 201 and deleted[0] == 204), 'Dangling invoice reference'
            if created[0] == 201:
                iid = created[1]['id']
                assert request(API, 'GET', '/api/products/' + pid, token=token)[0] == 200
            if deleted[0] == 204:
                pid = None
        finally:
            for base, resource, identifier in [(PURCHASING, 'invoices', iid), (API, 'products', pid), (PURCHASING, 'suppliers', sid)]:
                if identifier:
                    assert request(base, 'DELETE', f'/api/{resource}/{identifier}', token=token)[0] == 204
    print('PASS: 5 concurrent invoice-create/product-delete races without broken references.')


if __name__ == '__main__':
    run()
