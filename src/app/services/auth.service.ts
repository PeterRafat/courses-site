import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { User } from '../models/entities';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from '../core/error-handler.service';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {}

  login(body: LoginRequest): Observable<{ token: string; refreshToken?: string; user: User }> {
    // Log the request for debugging
    console.log('Login request:', `${this.baseUrl}/Auth/login`, body);
    return this.http.post<any>(`${this.baseUrl}/Auth/login`, body).pipe(
      map(res => {
        // Log the response for debugging
        console.log('Login response:', res);
        
        // Handle various possible response formats
        let data = res;
        // If response has a data property, use that
        if (res && typeof res === 'object' && 'data' in res) {
          data = res.data;
        }
        
        // Extract token (could be in different places)
        const token = data?.token ?? data?.accessToken ?? res?.token ?? res?.accessToken ?? '';
        const refreshToken = data?.refreshToken ?? res?.refreshToken ?? '';
        
        // Extract user data (could be in different places)
        let userData = data;
        if (data && typeof data === 'object' && 'user' in data) {
          userData = data.user;
        } else if (res && typeof res === 'object' && 'user' in res) {
          userData = res.user;
        }
        
        // Create user object with fallbacks
        const user: User = {
          userId: userData?.id ?? userData?.userId ?? data?.id ?? data?.userId ?? 0,
          fullName: userData?.fullName ?? userData?.name ?? data?.fullName ?? data?.name ?? '',
          email: userData?.email ?? data?.email ?? body.email,
          phone: userData?.phone ?? data?.phone ?? '',
          role: userData?.role ?? data?.role ?? undefined,
          isActive: !!(userData?.isActive ?? data?.isActive ?? userData?.active ?? data?.active ?? true),
          createdAt: userData?.createdAt ?? data?.createdAt ?? userData?.createdDate ?? data?.createdDate ?? new Date().toISOString()
        } as User;
        
        // Store tokens and role in localStorage
        if (token) { 
          try { localStorage.setItem('token', token); } catch (e) { console.warn('Failed to store token:', e); }
        }
        if (refreshToken) { 
          try { localStorage.setItem('refreshToken', refreshToken); } catch (e) { console.warn('Failed to store refresh token:', e); }
        }
        if (user.role) { 
          try { localStorage.setItem('role', String(user.role)); } catch (e) { console.warn('Failed to store role:', e); }
        }
        
        return { token, refreshToken, user };
      }),
      catchError(err => { 
        console.error('Login error:', err);
        // Provide more specific error message for common issues
        let errorMessage = 'فشل تسجيل الدخول';
        if (err?.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else if (err?.status === 0) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت';
        }
        this.errorHandler.showError(err, errorMessage); 
        return throwError(() => err); 
      })
    );
  }

  register(body: RegisterRequest): Observable<User> {
    console.log('Register request:', `${this.baseUrl}/Auth/register`, body);
    return this.http.post<any>(`${this.baseUrl}/Auth/register`, body).pipe(
      map(res => {
        console.log('Register response:', res);
        // Handle various possible response formats
        let data = res;
        // If response has a data property, use that
        if (res && typeof res === 'object' && 'data' in res) {
          data = res.data;
        }
        
        // Extract user data (could be in different places)
        let userData = data;
        if (data && typeof data === 'object' && 'user' in data) {
          userData = data.user;
        } else if (res && typeof res === 'object' && 'user' in res) {
          userData = res.user;
        }
        
        // Create user object with fallbacks
        return {
          userId: userData?.id ?? userData?.userId ?? data?.id ?? data?.userId ?? 0,
          fullName: userData?.fullName ?? userData?.name ?? data?.fullName ?? data?.name ?? body.fullName,
          email: userData?.email ?? data?.email ?? body.email,
          phone: userData?.phone ?? data?.phone ?? body.phone,
          role: userData?.role ?? data?.role ?? undefined,
          isActive: !!(userData?.isActive ?? data?.isActive ?? userData?.active ?? data?.active ?? true),
          createdAt: userData?.createdAt ?? data?.createdAt ?? userData?.createdDate ?? data?.createdDate ?? new Date().toISOString()
        } as User;
      }),
      catchError(err => { 
        console.error('Register error:', err);
        // Provide more specific error message for common issues
        let errorMessage = 'فشل إنشاء الحساب';
        if (err?.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else if (err?.status === 0) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت';
        }
        this.errorHandler.showError(err, errorMessage); 
        return throwError(() => err); 
      })
    );
  }

  me(): Observable<User> {
    console.log('Me request:', `${this.baseUrl}/Auth/me`);
    return this.http.get<any>(`${this.baseUrl}/Auth/me`).pipe(
      map(res => {
        console.log('Me response:', res);
        // Handle various possible response formats
        let data = res;
        // If response has a data property, use that
        if (res && typeof res === 'object' && 'data' in res) {
          data = res.data;
        }
        
        // Extract user data (could be in different places)
        let userData = data;
        if (data && typeof data === 'object' && 'user' in data) {
          userData = data.user;
        } else if (res && typeof res === 'object' && 'user' in res) {
          userData = res.user;
        }
        
        // Create user object with fallbacks
        return {
          userId: userData?.id ?? userData?.userId ?? data?.id ?? data?.userId ?? 0,
          fullName: userData?.fullName ?? userData?.name ?? data?.fullName ?? data?.name ?? '',
          email: userData?.email ?? data?.email ?? '',
          phone: userData?.phone ?? data?.phone ?? '',
          role: userData?.role ?? data?.role ?? undefined,
          isActive: !!(userData?.isActive ?? data?.isActive ?? userData?.active ?? data?.active ?? true),
          createdAt: userData?.createdAt ?? data?.createdAt ?? userData?.createdDate ?? data?.createdDate ?? new Date().toISOString()
        } as User;
      }),
      catchError(err => { 
        console.error('Me error:', err);
        // Provide more specific error message for common issues
        let errorMessage = 'فشل جلب بيانات المستخدم';
        if (err?.status === 500) {
          errorMessage = 'خطأ في الخادم. يرجى المحاولة لاحقاً';
        } else if (err?.status === 0) {
          errorMessage = 'لا يمكن الاتصال بالخادم. تحقق من اتصالك بالإنترنت';
        }
        this.errorHandler.showError(err, errorMessage); 
        return of({
          userId: 0, fullName: '', phone: '', email: '', createdAt: new Date().toISOString(), isActive: false
        } as User); 
      })
    );
  }

  logout(): void {
    try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); } catch {}
  }
}
