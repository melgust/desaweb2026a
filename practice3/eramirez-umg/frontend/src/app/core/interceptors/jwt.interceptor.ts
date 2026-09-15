import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const token = inject(AuthService).getToken();
  const ownApi = [environment.apiUrl, environment.catalogApiUrl, environment.cartApiUrl]
    .some(base => req.url === base || req.url.startsWith(base + '/'));
  if (token && ownApi) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` },
    });
  }
  return next(req);
};
