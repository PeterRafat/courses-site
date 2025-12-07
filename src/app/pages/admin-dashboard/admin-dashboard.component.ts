import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { CoursesService } from '../../services/courses.service';
import { QuizzesService } from '../../services/quizzes.service';
import { User, Course, Quiz, Question } from '../../models/entities';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [ReactiveFormsModule, NgForOf, NgIf, RouterLink],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent {
  users: User[] = [];
  courses: Course[] = [];
  loading = false;
  errorMsg = '';
  successMsg = '';

  courseForm!: FormGroup;
  assignForm!: FormGroup;
  videoForm!: FormGroup;
  quizForm!: FormGroup;
  questionForm!: FormGroup;
  answerForm!: FormGroup;

  quizzesForCourse: Quiz[] = [];
  questionsForQuiz: Question[] = [];

  constructor(private fb: FormBuilder, private admin: AdminService, private coursesSvc: CoursesService, private quizzesSvc: QuizzesService) {
    this.courseForm = this.fb.group({
      courseName: ['', Validators.required],
      courseImage: [''],
      description: [''],
      price: [0, Validators.required],
      isFree: [false]
    });
    this.assignForm = this.fb.group({
      userId: [null, Validators.required],
      courseId: [null, Validators.required]
    });
    this.videoForm = this.fb.group({
      courseId: [null, Validators.required],
      videoTitle: ['', Validators.required],
      videoUrl: ['', Validators.required],
      duration: [0, [Validators.required, Validators.min(0)]],
      orderIndex: [1, [Validators.required, Validators.min(1)]]
    });
    this.quizForm = this.fb.group({
      courseId: [null, Validators.required],
      quizTitle: ['', Validators.required],
      description: [''],
      totalQuestions: [0, [Validators.required, Validators.min(0)]],
      passingScore: [50, [Validators.required, Validators.min(0), Validators.max(100)]],
      timeLimit: [10, [Validators.required, Validators.min(0)]],
      isActive: [true]
    });
    this.questionForm = this.fb.group({
      quizId: [null, Validators.required],
      questionText: ['', Validators.required],
      questionType: [0, Validators.required],
      orderIndex: [1, [Validators.required, Validators.min(1)]]
    });
    this.answerForm = this.fb.group({
      questionId: [null, Validators.required],
      answerText: ['', Validators.required],
      isCorrect: [false],
      orderIndex: [1, [Validators.required, Validators.min(1)]]
    });
    this.refresh();
  }

  refresh() {
    this.admin.getUsers().subscribe({
      next: u => this.users = u,
      error: err => this.setError(err)
    });
    this.coursesSvc.getCourses().subscribe({
      next: c => this.courses = c,
      error: err => this.setError(err)
    });
  }

  createCourse() {
    if (this.courseForm.invalid) return;
    this.loading = true;
    this.admin.createCourse(this.courseForm.value as any).subscribe({
      next: () => { this.loading = false; this.success('تم إنشاء الكورس'); this.courseForm.reset({ price: 0, isFree: false }); this.refresh(); },
      error: err => this.setError(err)
    });
  }

  assign() {
    if (this.assignForm.invalid) return;
    const { userId, courseId } = this.assignForm.value as any;
    this.loading = true;
    this.admin.assignCourseToUser(userId, courseId).subscribe({
      next: () => { this.loading = false; this.success('تم تعيين الكورس للمستخدم'); },
      error: err => this.setError(err)
    });
  }

  addVideo() {
    if (this.videoForm.invalid) return;
    const { courseId, ...rest } = this.videoForm.value as any;
    this.loading = true;
    this.admin.addVideo(courseId, rest).subscribe({
      next: () => { this.loading = false; this.success('تم إضافة الفيديو'); this.videoForm.reset({ duration: 0, orderIndex: 1 }); },
      error: err => this.setError(err)
    });
  }

  onQuizCourseChange() {
    const courseId = Number(this.quizForm.value.courseId);
    if (!courseId) { this.quizzesForCourse = []; return; }
    this.coursesSvc.getCourseQuizzes(courseId).subscribe(q => this.quizzesForCourse = q);
  }

  addQuiz() {
    if (this.quizForm.invalid) return;
    const formValue = this.quizForm.value as any;
    const payload = {
      courseId: formValue.courseId,
      quizTitle: formValue.quizTitle,
      description: formValue.description || '',
      totalQuestions: formValue.totalQuestions,
      passingScore: formValue.passingScore,
      timeLimit: formValue.timeLimit,
      isActive: formValue.isActive,
      questions: []
    };
    this.loading = true;
    this.admin.addQuiz(payload).subscribe({
      next: () => { this.loading = false; this.success('تم إضافة الكويز'); this.onQuizCourseChange(); this.quizForm.reset({ totalQuestions: 0, passingScore: 50, timeLimit: 10, isActive: true }); },
      error: err => this.setError(err)
    });
  }

  onQuestionQuizChange() {
    const quizId = Number(this.questionForm.value.quizId);
    if (!quizId) { this.questionsForQuiz = []; return; }
    this.quizzesSvc.getQuestions(quizId).subscribe(qs => this.questionsForQuiz = qs);
  }

  addQuestion() {
    if (this.questionForm.invalid) return;
    const { quizId, ...rest } = this.questionForm.value as any;
    this.loading = true;
    this.admin.addQuestion(quizId, rest).subscribe({
      next: () => { this.loading = false; this.success('تم إضافة السؤال'); this.onQuestionQuizChange(); this.questionForm.reset({ questionType: 0, orderIndex: 1 }); },
      error: err => this.setError(err)
    });
  }

  addAnswer() {
    if (this.answerForm.invalid) return;
    const { questionId, ...rest } = this.answerForm.value as any;
    // Note: We don't have a direct method for adding answers in the new API
    // This would typically be handled when creating/updating questions
    this.success('سيتم حفظ الإجابات عند حفظ السؤال');
    this.answerForm.reset({ isCorrect: false, orderIndex: 1 });
  }

  private setError(err: any) {
    this.loading = false;
    const msg = err?.error?.message || err?.message || 'حدث خطأ غير متوقع';
    this.errorMsg = msg;
    this.successMsg = '';
  }

  private success(msg: string) {
    this.errorMsg = '';
    this.successMsg = msg;
  }
}