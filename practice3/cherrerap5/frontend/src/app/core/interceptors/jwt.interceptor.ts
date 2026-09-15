import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';
import { catchError, throwError } from 'rxjs';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const trusted = [environment.apiUrl, environment.catalogApiUrl, environment.orderApiUrl]
    .some(base => req.url === base || req.url.startsWith(base + '/'));
  if (token && trusted) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req).pipe(catchError((error: HttpErrorResponse) => {
    if (trusted && error.status === 401 && token === auth.getToken() && !req.url.endsWith('/auth/login')) auth.logout();
    return throwError(() => error);
  }));
};
