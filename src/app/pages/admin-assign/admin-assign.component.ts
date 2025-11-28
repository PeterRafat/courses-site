import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgForOf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../../services/admin.service';
import { CoursesService } from '../../services/courses.service';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { User, Course } from '../../models/entities';

@Component({
  selector: 'app-admin-assign',
  standalone: true,
  imports: [ReactiveFormsModule, NgForOf, RouterLink, RouterLinkActive],
  templateUrl: './admin-assign.component.html'
})
export class AdminAssignComponent {
  users: User[] = [];
  courses: Course[] = [];
  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private admin: AdminService,
    private coursesSvc: CoursesService,
    private toastr: ToastrService,
    private errorHandler: ErrorHandlerService
  ) {
    this.form = this.fb.group({
      userId: [null, Validators.required],
      courseId: [null, Validators.required]
    });
    this.refresh();
  }

  refresh() {
    this.admin.getUsers().subscribe({
      next: (u) => (this.users = u),
      error: (err) => this.errorHandler.showError(err, 'خطأ في تحميل المستخدمين')
    });
    this.coursesSvc.getCourses().subscribe({
      next: (c) => (this.courses = c),
      error: (err) => this.errorHandler.showError(err, 'خطأ في تحميل الكورسات')
    });
  }

  submit() {
    if (this.form.invalid) {
      this.toastr.warning('يرجى ملء جميع الحقول المطلوبة', 'تحذير');
      return;
    }
    const { userId, courseId } = this.form.value as any;
    this.loading = true;
    this.admin.assignCourseToUser(userId, courseId).subscribe({
      next: () => {
        this.loading = false;
        this.toastr.success('تم تعيين الكورس للمستخدم بنجاح', 'نجاح');
        this.form.reset();
      },
      error: (err) => {
        this.loading = false;
        this.errorHandler.showError(err, 'خطأ في تعيين الكورس');
      }
    });
  }
}