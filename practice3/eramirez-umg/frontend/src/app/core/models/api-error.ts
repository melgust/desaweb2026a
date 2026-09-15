import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'Could not connect to the service. Check your connection and try again.';
    if (error.status === 401) return 'Your session has expired. Please sign in again.';
    if (typeof error.error?.message === 'string') return error.error.message;
    if (error.status === 503 || error.status === 502) return 'The service is temporarily unavailable. Please try again.';
    if (error.status === 400 && error.error?.errors) return 'Check the required fields, dates and amounts.';
  }
  return fallback;
}
