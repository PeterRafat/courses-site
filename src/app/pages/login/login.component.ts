import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgIf, NgClass } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink } from '@angular/router';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  form!: FormGroup;
  loading = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private fb: FormBuilder, private auth: AuthService, private router: Router, private errHandler: ErrorHandlerService, private toastr: ToastrService) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  submit() {
    if (this.form.invalid) return;
    console.log('Submitting login form:', this.form.value);
    this.loading = true;
    this.auth.login(this.form.value as any).subscribe({
      next: (res) => {
        console.log('Login successful:', res);
        this.loading = false;
        this.toastr.success('تم تسجيل الدخول بنجاح');
        const role = res?.user?.role?.toLowerCase();
        if (role === 'admin') {
          this.router.navigateByUrl('/admin/courses');
        } else {
          this.router.navigateByUrl('/courses');
        }
      },
      error: (err) => {
        console.log('Login failed:', err);
        this.loading = false;
        console.error('Login component error:', err);
        const msg = this.errHandler.getErrorMessage(err);
        this.toastr.error(msg);
        // Don't redirect to login on login error as we're already on the login page
      }
    });
  }

  private showToast(elementId: string) {}
}