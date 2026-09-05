import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

import { CustomerService } from '../../../../core/services/customer.service';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule
  ],
  templateUrl: './customer-form.component.html',
  styleUrls: ['./customer-form.component.css']
})
export class CustomerFormComponent implements OnInit {

  isEditMode = false;
  customerId: string | null = null;
  loading = false;

  formData = {
    name: '',
    nit: '',
    address: '',
    phone: '',
    email: '',
    isActive: true
  };

  constructor(
    private customerService: CustomerService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.customerId = this.route.snapshot.paramMap.get('id');

    if (this.customerId) {
      this.isEditMode = true;
      this.loadCustomer(this.customerId);
    }
  }

  loadCustomer(id: string): void {
    this.loading = true;

    this.customerService.getCustomerById(id).subscribe({
      next: (customer) => {
        this.formData = {
          name: customer.name,
          nit: customer.nit || '',
          address: customer.address || '',
          phone: customer.phone || '',
          email: customer.email || '',
          isActive: customer.isActive
        };

        this.loading = false;
      },
      error: () => {
        this.router.navigate(['/customers']);
      }
    });
  }

  onSubmit(): void {
    this.loading = true;

    const request$ =
      this.isEditMode && this.customerId
        ? this.customerService.updateCustomer(this.customerId, this.formData)
        : this.customerService.createCustomer(this.formData);

    request$.subscribe({
      next: () => {
        this.router.navigate(['/customers']);
      },
      error: () => {
        this.loading = false;
      }
    });
  }
}
