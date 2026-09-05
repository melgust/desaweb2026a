import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SupplierService } from '../../../../core/services/supplier.service';

@Component({ selector: 'app-supplier-form', standalone: true, imports: [CommonModule, FormsModule, RouterModule], templateUrl: './supplier-form.component.html' })
export class SupplierFormComponent implements OnInit {
  id: string | null = null; loading = false; error = '';
  formData = { name: '', taxId: '', email: '', phone: '', isActive: true };
  constructor(private service: SupplierService, private route: ActivatedRoute, private router: Router) {}
  ngOnInit(): void { this.id = this.route.snapshot.paramMap.get('id'); if (this.id) this.service.getById(this.id).subscribe({ next: s => this.formData = { name: s.name, taxId: s.taxId || '', email: s.email || '', phone: s.phone || '', isActive: s.isActive }, error: () => this.router.navigate(['/suppliers']) }); }
  submit(): void { this.loading = true; this.error = ''; const request = this.id ? this.service.update(this.id, this.formData) : this.service.create(this.formData); request.subscribe({ next: () => this.router.navigate(['/suppliers']), error: e => { this.error = e.error?.error || 'No se pudo guardar el proveedor.'; this.loading = false; } }); }
}
