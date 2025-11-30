import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, BehaviorSubject, switchMap, filter, take } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Add common headers for API requests
  let headers: { [key: string]: string } = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };
  
  // Add authorization header if token exists and it's not a login/register request
  if (token && !req.url.includes('/Auth/login') && !req.url.includes('/Auth/register')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  req = req.clone({
    setHeaders: headers
  });
  
  return next(req).pipe(
    catchError((error) => {
      console.error('HTTP Error:', error);
      
      // Handle unauthorized errors
      if (error.status === 401 || error.status === 403) {
        // Clear local storage
        try {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('role');
        } catch (e) {
          console.error('Error clearing localStorage:', e);
        }
        
        // Redirect to login
        router.navigate(['/login']);
      }
      
      return throwError(() => error);
    })
  );
};