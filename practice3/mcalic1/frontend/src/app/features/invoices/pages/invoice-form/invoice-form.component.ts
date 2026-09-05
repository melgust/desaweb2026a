import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { InvoiceService } from '../../../../core/services/invoice.service';
import { CustomerService } from '../../../../core/services/customer.service';
import { ProductService } from '../../../../core/services/product.service';

import { Customer } from '../../../../core/models/customer.model';
import { Product } from '../../../../core/models/product.model';
import { CreateInvoiceRequest } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './invoice-form.component.html',
  styleUrls: ['./invoice-form.component.css']
})
export class InvoiceFormComponent implements OnInit {
  customers: Customer[] = [];
  products: Product[] = [];

  loading = false;

  formData = {
    invoiceNumber: '',
    customerId: '',
    date: '',
    details: [
      {
        productId: '',
        quantity: 1
      }
    ]
  };

  constructor(
    private invoiceService: InvoiceService,
    private customerService: CustomerService,
    private productService: ProductService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCustomers();
    this.loadProducts();
  }

  loadCustomers(): void {
    this.customerService
      .getCustomers('', 1, 100)
      .subscribe({
        next: (res) => {
          this.customers = res.items.filter(
            customer => customer.isActive
          );
        }
      });
  }

  loadProducts(): void {
    this.productService
      .getProducts('', 'name', 'asc', 1, 100)
      .subscribe({
        next: (res) => {
          this.products = res.items.filter(
            product => product.isActive && product.stock > 0
          );
        }
      });
  }

  addDetail(): void {
    this.formData.details.push({
      productId: '',
      quantity: 1
    });
  }

  removeDetail(index: number): void {
    if (this.formData.details.length > 1) {
      this.formData.details.splice(index, 1);
    }
  }

  getProductPrice(productId: string): number {
    const product = this.products.find(
      p => p.id === productId
    );

    return product ? product.price : 0;
  }

  getSubtotal(productId: string, quantity: number): number {
    return this.getProductPrice(productId) * quantity;
  }

  getTotal(): number {
    return this.formData.details.reduce(
      (total, detail) =>
        total +
        this.getSubtotal(
          detail.productId,
          detail.quantity
        ),
      0
    );
  }

  onSubmit(): void {
    if (
      !this.formData.invoiceNumber ||
      !this.formData.customerId
    ) {
      return;
    }

    const validDetails = this.formData.details.filter(
      detail =>
        detail.productId &&
        detail.quantity > 0
    );

    if (validDetails.length === 0) {
      return;
    }

    const request: CreateInvoiceRequest = {
      invoiceNumber: this.formData.invoiceNumber,
      customerId: this.formData.customerId,
      details: validDetails.map(detail => ({
        productId: detail.productId,
        quantity: detail.quantity
      }))
    };

    if (this.formData.date) {
      request.date = new Date(
        this.formData.date
      ).toISOString();
    }

    this.loading = true;

    this.invoiceService
      .createInvoice(request)
      .subscribe({
        next: () => {
          this.router.navigate(['/invoices']);
        },
        error: () => {
          this.loading = false;
        }
      });
  }
}