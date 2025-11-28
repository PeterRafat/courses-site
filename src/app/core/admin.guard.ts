import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const adminGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = typeof localStorage !== 'undefined' ? localStorage.getItem('token') : null;
  const role = typeof localStorage !== 'undefined' ? localStorage.getItem('role') : null;
  if (token && role && role.toLowerCase() === 'admin') return true;
  return router.parseUrl('/login');
};