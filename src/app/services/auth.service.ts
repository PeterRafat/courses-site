import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { catchError, tap, map } from 'rxjs/operators';
import { User } from '../models/entities';
import { USE_MOCK, mockUsers } from '../mock/mock-data';
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
    if (USE_MOCK) return of({ token: 'mock-token', user: mockUsers[0] });
    return this.http.post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Auth/login`, body).pipe(
      map(res => {
        const token = res?.data?.token ?? '';
        const refreshToken = res?.data?.refreshToken ?? '';
        const u = res?.data?.user ?? {};
        const user: User = {
          userId: u.id ?? 0,
          fullName: u.fullName ?? '',
          email: u.email ?? body.email,
          phone: u.phone ?? '',
          role: u.role ?? undefined,
          isActive: !!u.isActive,
          createdAt: u.createdAt ?? new Date().toISOString()
        } as User;
        if (token) { try { localStorage.setItem('token', token); } catch {} }
        if (refreshToken) { try { localStorage.setItem('refreshToken', refreshToken); } catch {} }
        if (user.role) { try { localStorage.setItem('role', String(user.role)); } catch {} }
        return { token, refreshToken, user };
      }),
      catchError(err => { this.errorHandler.showError(err, 'فشل تسجيل الدخول'); return throwError(() => err); })
    );
  }

  register(body: RegisterRequest): Observable<User> {
    if (USE_MOCK) return of({ ...mockUsers[0], userId: 2, fullName: body.fullName, email: body.email, phone: body.phone });
    return this.http.post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Auth/register`, body).pipe(
      map(res => ({
        userId: res?.data?.id ?? 0,
        fullName: res?.data?.fullName ?? body.fullName,
        email: res?.data?.email ?? body.email,
        phone: res?.data?.phone ?? body.phone,
        role: res?.data?.role ?? undefined,
        isActive: !!res?.data?.isActive,
        createdAt: res?.data?.createdAt ?? new Date().toISOString()
      } as User)),
      catchError(err => { this.errorHandler.showError(err, 'فشل إنشاء الحساب'); return throwError(() => err); })
    );
  }

  me(): Observable<User> {
    if (USE_MOCK) return of(mockUsers[0]);
    return this.http.get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Auth/me`).pipe(
      map(res => ({
        userId: res?.data?.id ?? 0,
        fullName: res?.data?.fullName ?? '',
        email: res?.data?.email ?? '',
        phone: res?.data?.phone ?? '',
        role: res?.data?.role ?? undefined,
        isActive: !!res?.data?.isActive,
        createdAt: res?.data?.createdAt ?? new Date().toISOString()
      } as User)),
      catchError(err => { this.errorHandler.showError(err, 'فشل جلب بيانات المستخدم'); return of({
        userId: 0, fullName: '', phone: '', email: '', createdAt: new Date().toISOString(), isActive: false
      } as User); })
    );
  }

  logout(): void {
    try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); } catch {}
  }
}
