import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { CoursesService } from '../../services/courses.service';
import { Course } from '../../models/entities';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-admin-videos',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgForOf, NgIf, RouterLink, RouterLinkActive],
  templateUrl: './admin-videos.component.html'
})
export class AdminVideosComponent {
  courses: Course[] = [];
  form!: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  sourceType: 'link' | 'file' = 'link';
  videoFile?: File | null;
  selectedCourseId?: number | null;
  videos: { id: number; title: string; url: string; duration: number; orderIndex: number }[] = [];

  constructor(private fb: FormBuilder, private admin: AdminService, private coursesSvc: CoursesService, private errorHandler: ErrorHandlerService, private toastr: ToastrService) {
    this.form = this.fb.group({
      courseId: [null, Validators.required],
      videoTitle: ['', Validators.required],
      videoUrl: [''],
      duration: [1, [Validators.required, Validators.min(1)]],
      orderIndex: [1, [Validators.required, Validators.min(1)]]
    });
    this.coursesSvc.getCourses().subscribe({ next: c => this.courses = c, error: err => this.setError(err) });
  }

  submit() {
    const linkMode = this.sourceType === 'link';
    if (linkMode) {
      this.form.get('videoUrl')?.addValidators([Validators.required]);
      this.form.get('videoUrl')?.updateValueAndValidity();
    } else {
      this.form.get('videoUrl')?.clearValidators();
      this.form.get('videoUrl')?.updateValueAndValidity();
    }
    if (this.form.invalid) return;
    const { courseId, videoTitle, videoUrl, duration, orderIndex } = this.form.value as any;
    if (Number(duration) <= 0) { this.setError({ message: 'مدة الفيديو يجب أن تكون أكبر من 0' }); return; }
    this.loading = true;
    if (linkMode) {
      this.admin.addVideo(courseId, { videoTitle, videoUrl, duration, orderIndex }).subscribe({
        next: (created) => { 
          this.loading = false; 
          this.success('تم إضافة الفيديو'); 
          this.toastr.success('تم إضافة الفيديو بنجاح');
          this.refreshVideos(courseId);
          this.resetForm(); 
        },
        error: err => this.setError(err)
      });
    } else {
      if (!this.videoFile) { this.setError({ message: 'يجب اختيار ملف فيديو' }); return; }
      // Show a message indicating that video upload may take some time
      this.toastr.info('جارٍ رفع الفيديو... قد يستغرق هذا بعض الوقت حسب حجم الملف', 'معلومة');
      this.admin.uploadVideo({ courseId, videoTitle, duration, orderIndex }, this.videoFile).subscribe({
        next: (created) => { 
          this.loading = false; 
          this.success('تم رفع الفيديو'); 
          this.toastr.success('تم رفع الفيديو بنجاح');
          this.refreshVideos(courseId);
          this.resetForm(); 
        },
        error: err => {
          this.setError(err);
          // Show additional error message for timeout issues
          if (err.message && err.message.includes('انتهت مهلة')) {
            this.toastr.error('يرجى المحاولة مرة أخرى مع فيديو أصغر حجمًا أو التحقق من سرعة الإنترنت', 'مشكلة في رفع الفيديو');
          }
        }
      });
    }
  }

  setSource(type: 'link' | 'file') {
    this.sourceType = type;
  }

  onCourseChange(event: Event) {
    const select = event.target as HTMLSelectElement;
    const cid = Number(select.value);
    this.selectedCourseId = cid || null;
    if (!cid) { this.videos = []; return; }
    this.admin.getVideosByCourse(cid).subscribe({
      next: (list) => {
        this.videos = list.map(v => ({ id: v.videoId, title: v.videoTitle, url: v.videoUrl, duration: v.duration, orderIndex: v.orderIndex }));
      },
      error: (err) => this.setError(err)
    });
  }

  private refreshVideos(courseId: number) {
    if (!courseId) return;
    this.admin.getVideosByCourse(courseId).subscribe({
      next: (list) => {
        if (this.selectedCourseId === courseId) {
          this.videos = list.map(v => ({ id: v.videoId, title: v.videoTitle, url: v.videoUrl, duration: v.duration, orderIndex: v.orderIndex }));
        }
      },
      error: (err) => this.setError(err)
    });
  }

  updateVideo(v: { id: number; title: string; url: string; duration: number; orderIndex: number }) {
    this.loading = true;
    this.admin.updateVideo(v.id, { courseId: this.selectedCourseId ?? 0, videoTitle: v.title, videoUrl: v.url, duration: v.duration, orderIndex: v.orderIndex }).subscribe({
      next: () => { this.loading = false; this.success('تم تحديث الفيديو'); this.toastr.success('تم تحديث الفيديو بنجاح'); },
      error: (err) => this.setError(err)
    });
  }

  deleteVideo(id: number) {
    // Show confirmation dialog before deleting
    if (!confirm('هل أنت متأكد من حذف هذا الفيديو؟')) {
      return;
    }
    
    this.loading = true;
    this.admin.deleteVideo(id).subscribe({
      next: () => {
        this.loading = false;
        this.videos = this.videos.filter(x => x.id !== id);
        this.success('تم حذف الفيديو');
        this.toastr.success('تم حذف الفيديو بنجاح');
      },
      error: (err) => {
        this.loading = false;
        this.setError(err);
      }
    });
  }

  onVideoSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.videoFile = (input.files && input.files[0]) ? input.files[0] : null;
  }

  private setError(err: any) {
    this.loading = false;
    const msg = this.errorHandler.getErrorMessage(err);
    this.errorMsg = msg;
    this.successMsg = '';
    this.toastr.error(msg, 'خطأ');
  }

  private success(msg: string) {
    this.errorMsg = '';
    this.successMsg = msg;
  }

  private resetForm() {
    this.form.reset({ duration: 1, orderIndex: 1 });
    this.videoFile = null;
    this.sourceType = 'link';
  }
}
