import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgIf, NgClass, CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { ToastrService } from 'ngx-toastr';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink,CommonModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  form!: FormGroup;
  loading = false;
  toastMsg = '';
  toastType: 'success' | 'error' = 'success';

  constructor(private fb: FormBuilder, private auth: AuthService, private errHandler: ErrorHandlerService, private toastr: ToastrService) {
    this.form = this.fb.group({
      fullName: ['', Validators.required],
      phone: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirm: ['', [Validators.required, Validators.minLength(6)]]
    }, { validators: this.passwordMatchValidator });
  }

  private passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirm = control.get('confirm');
    
    if (password && confirm && password.value !== confirm.value) {
      return { passwordMismatch: true };
    }
    return null;
  }

  submit() {
    if (this.form.invalid) return;
    const { fullName, phone, email, password, confirm } = this.form.value as any;
    this.loading = true;
    this.auth.register({ fullName, phone, email, password, confirmPassword: confirm }).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('تم إنشاء الحساب بنجاح');
      },
      error: (err) => {
        this.loading = false;
        const msg = this.errHandler.getErrorMessage(err);
        this.toastr.error(msg);
      }
    });
  }

  private showToast(elementId: string) {}
}