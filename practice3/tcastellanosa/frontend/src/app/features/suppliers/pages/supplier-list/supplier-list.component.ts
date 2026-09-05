import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupplierService } from '../../../../core/services/supplier.service';
import { Supplier } from '../../../../core/models/supplier.model';
import { AuthService } from '../../../../core/services/auth.service';

@Component({ selector: 'app-supplier-list', standalone: true, imports: [CommonModule, RouterModule], templateUrl: './supplier-list.component.html' })
export class SupplierListComponent implements OnInit {
  suppliers = signal<Supplier[]>([]); loading = signal(true); error = '';
  constructor(public auth: AuthService, private supplierService: SupplierService) {}
  ngOnInit(): void { this.load(); }
  load(): void { this.loading.set(true); this.supplierService.getAll().subscribe({ next: x => { this.suppliers.set(x); this.loading.set(false); }, error: e => { this.error = e.error?.error || 'No se pudieron cargar los proveedores.'; this.loading.set(false); } }); }
  delete(id: string): void { if (confirm('¿Eliminar este proveedor?')) this.supplierService.delete(id).subscribe({ next: () => this.load(), error: e => this.error = e.error?.error || 'No se pudo eliminar el proveedor.' }); }
}
