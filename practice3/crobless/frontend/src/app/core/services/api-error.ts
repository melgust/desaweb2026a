import { HttpErrorResponse } from '@angular/common/http';

export function apiError(error: HttpErrorResponse): string {
  if (error.status === 0) return 'No se pudo conectar con el servidor.';
  if (error.status === 401) return 'La sesión expiró. Inicia sesión nuevamente.';
  if (error.status === 403) return 'No tienes permisos para realizar esta operación.';
  if (error.error?.message) return error.error.message;
  if (error.error?.errors) return Object.values(error.error.errors).flat().join(' ');
  return 'No se pudo completar la operación. Intenta nuevamente.';
}
