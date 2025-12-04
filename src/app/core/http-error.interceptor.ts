import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError, BehaviorSubject, switchMap, filter, take, shareReplay, timeout, tap } from 'rxjs';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const httpErrorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthService);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  
  // Log the request for debugging
  console.log('Making HTTP request:', req.method, req.url);
  
  // Check if this is a FormData request
  const isFormData = req.body instanceof FormData;
  
  // Add common headers for API requests, but not for FormData
  let headers: { [key: string]: string } = {};
  
  // Add cache control for GET requests
  if (req.method === 'GET') {
    headers['Cache-Control'] = 'max-age=300'; // Cache for 5 minutes
    headers['Expires'] = new Date(Date.now() + 300000).toUTCString();
  }
  
  // Only add Content-Type for non-FormData requests
  if (!isFormData) {
    headers['Content-Type'] = 'application/json';
  }
  
  // Always add Accept header
  headers['Accept'] = 'application/json';
  
  // Add authorization header if token exists and it's not a login/register request
  if (token && !req.url.includes('/Auth/login') && !req.url.includes('/Auth/register')) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  req = req.clone({
    setHeaders: headers
  });
  
  return next(req).pipe(
    // Add timeout for better user experience
    timeout(10000), // 10 second timeout
    // Add caching for GET requests
    req.method === 'GET' ? shareReplay(1, 300000) : tap(() => {}), // Cache for 5 minutes
    catchError((error) => {
      console.error('HTTP Error:', error);
      
      // Handle timeout errors
      if (error.name === 'TimeoutError') {
        // Create a custom error object for timeout
        const timeoutError = {
          status: 408,
          statusText: 'Request Timeout',
          message: 'انتهت مهلة الطلب. يرجى التحقق من اتصالك بالإنترنت والمحاولة مرة أخرى.'
        };
        return throwError(() => timeoutError);
      }
      
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