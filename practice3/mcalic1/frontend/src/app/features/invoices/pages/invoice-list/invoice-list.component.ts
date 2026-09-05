import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { InvoiceService } from '../../../../core/services/invoice.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Invoice } from '../../../../core/models/invoice.model';

@Component({
  selector: 'app-invoice-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatPaginatorModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule
  ],
  templateUrl: './invoice-list.component.html',
  styleUrls: ['./invoice-list.component.css']
})
export class InvoiceListComponent implements OnInit {
  invoices = signal<Invoice[]>([]);
  totalItems = signal(0);
  loading = signal(false);

  pageIndex = 0;
  pageSize = 10;
  readonly pageSizeOptions = [5, 10, 25, 50];

  displayedColumns: string[] = [
    'invoiceNumber',
    'date',
    'customerName',
    'total'
  ];

  constructor(
    public auth: AuthService,
    private invoiceService: InvoiceService
  ) {}

  ngOnInit(): void {
    if (this.auth.canManageProducts()) {
      this.displayedColumns = [...this.displayedColumns, 'actions'];
    }

    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);

    this.invoiceService
      .getInvoices(this.pageIndex + 1, this.pageSize)
      .subscribe({
        next: (res) => {
          this.invoices.set(res.items);
          this.totalItems.set(res.totalItems);
          this.loading.set(false);
        },
        error: () => this.loading.set(false)
      });
  }

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.loadInvoices();
  }
}