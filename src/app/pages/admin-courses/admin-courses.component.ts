import { Component, OnInit } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgIf, NgForOf, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Course } from '../../models/entities';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { ToastrService } from 'ngx-toastr';
import { forkJoin } from 'rxjs';
import { environment } from '../../../environments/environment';
import { formatCourseImageUrl } from '../../utils/image-url.util';

@Component({
  selector: 'app-admin-courses',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgForOf, RouterLink, CurrencyPipe],
  templateUrl: './admin-courses.component.html',
  styleUrls: ['./admin-courses.component.css']
})
export class AdminCoursesComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  sourceType: 'link' | 'file' = 'link';
  imageFile?: File | null;
  courses: Course[] = [];
  editingCourseId: number | null = null;
  deleteBlockedMsg: string | null = null;
  lastFailedCourseId: number | null = null;
  // Flag to prevent infinite loop when fallback image also fails
  private fallbackImageSet = new WeakMap<HTMLImageElement, boolean>();

  constructor(
    private fb: FormBuilder, 
    private admin: AdminService,
    private errorHandler: ErrorHandlerService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      courseName: ['', Validators.required],
      courseImage: [''],
      description: [''],
      price: [0, Validators.required],
      isFree: [false]
    });
  }

  ngOnInit() {
    this.loadCoursesWithCounts();
  }

  loadCoursesWithCounts() {
    this.loading = true;
    this.admin.getCourses().subscribe({
      next: (courses) => {
        // Check if courses data is valid
        if (!courses || courses.length === 0) {
          this.courses = [];
          this.loading = false;
          return;
        }
        
        // Fetch video and quiz counts for each course
        const courseObservables = courses.map(course => 
          forkJoin({
            videos: this.admin.getVideosByCourse(course.courseId),
            quizzes: this.admin.getQuizzesByCourse(course.courseId)
          })
        );

        if (courseObservables.length === 0) {
          this.courses = courses;
          this.loading = false;
          return;
        }

        forkJoin(courseObservables).subscribe({
          next: (counts) => {
            this.courses = courses.map((course, index) => ({
              ...course,
              videoCount: counts[index].videos.length,
              quizCount: counts[index].quizzes.length
            }));
            this.loading = false;
          },
          error: (err) => {
            console.error('Error loading course counts:', err);
            this.setError(err);
            this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل تحميل إحصائيات الكورسات');
            // Still show courses even if counts failed
            this.courses = courses;
            this.loading = false;
          }
        });
      },
      error: (err) => {
        console.error('Error loading courses:', err);
        this.setError(err);
        this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل تحميل الكورسات');
        this.courses = []; // Set to empty array on error
        this.loading = false;
      }
    });
  }

  loadCourses() {
    this.admin.getCourses().subscribe({
      next: (courses) => {
        this.courses = courses;
      },
      error: (err) => {
        this.setError(err);
        this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل تحميل الكورسات');
      }
    });
  }

  // Method to get proper image URL using the same utility as user pages
  getImageUrl(imagePath: string): string {
    return formatCourseImageUrl(imagePath);
  }

  submit() {
    if (this.form.invalid) return;
    const { courseName, courseImage, description, price, isFree } = this.form.value as any;
    this.loading = true;
    
    if (this.editingCourseId) {
      // Update existing course
      if (this.sourceType === 'link') {
        this.admin.updateCourse(this.editingCourseId, { courseName, courseImage, description, price, isFree }).subscribe({
          next: () => { 
            this.loading = false; 
            this.success('تم تحديث الكورس'); 
            this.resetForm(); 
            this.loadCoursesWithCounts();
            this.toastr.success('تم تحديث الكورس بنجاح');
          },
          error: err => {
            this.setError(err);
            this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل تحديث الكورس');
          }
        });
      } else {
        if (!this.imageFile) { 
          this.setError({ message: 'يجب اختيار صورة للكورس' }); 
          this.loading = false;
          return; 
        }
        this.admin.updateCourseUpload(this.editingCourseId, { courseName, description, price, isFree }, this.imageFile).subscribe({
          next: () => { 
            this.loading = false; 
            this.success('تم تحديث الكورس مع الصورة'); 
            this.resetForm(); 
            this.loadCoursesWithCounts();
            this.toastr.success('تم تحديث الكورس مع الصورة بنجاح');
          },
          error: err => {
            this.setError(err);
            this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل تحديث الكورس');
          }
        });
      }
    } else {
      // Create new course
      if (this.sourceType === 'link') {
        this.admin.createCourse({ courseName, courseImage, description, price, isFree }).subscribe({
          next: () => { 
            this.loading = false; 
            this.success('تم إنشاء الكورس'); 
            this.resetForm(); 
            this.loadCoursesWithCounts();
            this.toastr.success('تم إنشاء الكورس بنجاح');
          },
          error: err => {
            this.setError(err);
            this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل إنشاء الكورس');
          }
        });
      } else {
        if (!this.imageFile) { 
          this.setError({ message: 'يجب اختيار صورة للكورس' }); 
          this.loading = false;
          return; 
        }
        this.admin.createCourseUpload({ courseName, description, price, isFree }, this.imageFile).subscribe({
          next: () => { 
            this.loading = false; 
            this.success('تم إنشاء الكورس مع الصورة'); 
            this.resetForm(); 
            this.loadCoursesWithCounts();
            this.toastr.success('تم إنشاء الكورس مع الصورة بنجاح');
          },
          error: err => {
            this.setError(err);
            this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل إنشاء الكورس');
          }
        });
      }
    }
  }

  editCourse(course: Course) {
    this.editingCourseId = course.courseId;
    this.form.patchValue({
      courseName: course.courseName,
      courseImage: course.courseImage,
      description: course.description,
      price: course.price,
      isFree: course.isFree
    });
    // Set source type based on whether there's an image URL
    this.sourceType = course.courseImage && this.isUploadedImage(course.courseImage) ? 'file' : 'link';
    // Scroll to form
    document.querySelector('.admin-card')?.scrollIntoView({ behavior: 'smooth' });
  }

  deleteCourse(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا الكورس؟')) return;
    
    this.loading = true;
    this.admin.deleteCourse(id).subscribe({
      next: () => {
        this.loading = false;
        this.success('تم حذف الكورس');
        this.loadCoursesWithCounts();
        this.toastr.success('تم حذف الكورس بنجاح');
        this.deleteBlockedMsg = null;
        this.lastFailedCourseId = null;
      },
      error: err => {
        this.loading = false;
        const rawMsg = this.errorHandler.getErrorMessage(err) || '';
        const arabicMsg = 'لا يمكن الحذف لوجود مستخدمين مسجلين';
        if (rawMsg.toLowerCase().includes('cannot delete course')) {
          this.deleteBlockedMsg = arabicMsg;
          this.lastFailedCourseId = id;
          this.toastr.warning(arabicMsg, 'تحذير');
        } else {
          this.setError(err);
          this.toastr.error(rawMsg, 'فشل حذف الكورس');
          this.deleteBlockedMsg = null;
          this.lastFailedCourseId = null;
        }
      }
    });
  }

  deactivateCourse(courseId: number) {
    if (!confirm('إلغاء تفعيل هذا الكورس؟ سيظل موجودًا بدون إمكانية الوصول.')) return;
    this.loading = true;
    this.admin.deactivateCourse(courseId).subscribe({
      next: () => {
        this.loading = false;
        this.success('تم إلغاء تفعيل الكورس');
        this.toastr.success('تم إلغاء تفعيل الكورس بنجاح');
        this.loadCoursesWithCounts();
        this.deleteBlockedMsg = null;
        this.lastFailedCourseId = null;
      },
      error: (err: any) => {
        this.loading = false;
        this.setError(err);
        this.toastr.error(this.errorHandler.getErrorMessage(err), 'فشل إلغاء التفعيل');
      }
    });
  }

  setSource(type: 'link' | 'file') { 
    this.sourceType = type; 
  }
  
  onImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = (input.files && input.files[0]) ? input.files[0] : null;
    if (!file) { this.imageFile = null; return; }
    const allowed = ['image/jpeg','image/png','image/gif','image/webp'];
    if (!allowed.includes(file.type)) {
      this.imageFile = null;
      this.setError({ message: 'نوع الصورة غير صالح. الأنواع المسموح بها: .jpg, .jpeg, .png, .gif, .webp' });
      this.toastr.error('نوع الصورة غير صالح. الأنواع المسموح بها: .jpg, .jpeg, .png, .gif, .webp');
      (event.target as HTMLInputElement).value = '';
      return;
    }
    this.imageFile = file;
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    
    // Check if we've already tried to set the fallback image to prevent infinite loop
    if (this.fallbackImageSet.has(img)) {
      // Set a data URL as final fallback to prevent infinite loop
      img.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iI2VlZSIvPjx0ZXh0IHg9IjUwIiB5PSI1NSIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjEyIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBmaWxsPSIjOTk5Ij5ubyBpbWFnZTwvdGV4dD48L3N2Zz4=';
      return;
    }
    
    // Mark that we're setting the fallback image
    this.fallbackImageSet.set(img, true);
    
    // Try to load a default placeholder image
    img.src = '/assets/images/placeholder-course.png';
  }

  // Method to determine if an image is uploaded (not a URL)
  isUploadedImage(imageUrl: string): boolean {
    // Check if it's a local uploaded image (doesn't start with http)
    return !!(imageUrl && !imageUrl.startsWith('http'));
  }

  cancelEdit() {
    this.editingCourseId = null;
    this.resetForm();
  }

  private setError(err: any) {
    this.loading = false;
    const msg = this.errorHandler.getErrorMessage(err);
    this.errorMsg = msg;
    this.successMsg = '';
  }

  private success(msg: string) {
    this.errorMsg = '';
    this.successMsg = msg;
  }

  private resetForm() {
    this.form.reset({ price: 0, isFree: false });
    this.sourceType = 'link';
    this.imageFile = null;
    this.editingCourseId = null;
  }
}
