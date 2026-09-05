import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { CustomerService } from '../../../../core/services/customer.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Customer } from '../../../../core/models/customer.model';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './customer-list.component.html',
  styleUrls: ['./customer-list.component.css']
})
export class CustomerListComponent implements OnInit {
  customers = signal<Customer[]>([]);
  totalItems = signal(0);
  loading = signal(false);

  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  searchTerm = '';

  displayedColumns: string[] = [
    'name',
    'nit',
    'phone',
    'email',
    'isActive'
  ];

  constructor(
    public auth: AuthService,
    private customerService: CustomerService
  ) {}

  ngOnInit(): void {
    if (this.auth.canManageProducts()) {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }

    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading.set(true);

    this.customerService
      .getCustomers(
        this.searchTerm,
        this.pageIndex + 1,
        this.pageSize
      )
      .subscribe({
        next: (res) => {
          this.customers.set(res.items);
          this.totalItems.set(res.totalItems);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onSearchChange(): void {
    this.pageIndex = 0;
    this.loadCustomers();
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadCustomers();
  }

  deleteCustomer(id: string): void {
    if (confirm('Delete customer?')) {
      this.customerService
        .deleteCustomer(id)
        .subscribe(() => this.loadCustomers());
    }
  }
}