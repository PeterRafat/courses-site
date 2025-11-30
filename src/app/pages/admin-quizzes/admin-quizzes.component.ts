import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators, FormGroup, FormArray } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { ToastrService } from 'ngx-toastr';
import { CoursesService } from '../../services/courses.service';
import { Course, Quiz } from '../../models/entities';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-admin-quizzes',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgForOf, NgIf, RouterLink],
  templateUrl: './admin-quizzes.component.html',
  styleUrls: ['./admin-quizzes.component.css']
})
export class AdminQuizzesComponent {
  courses: Course[] = [];
  quizzesForCourse: Quiz[] = [];
  form!: FormGroup;
  loading = false;
  errorMsg = '';
  successMsg = '';
  selectedCourseId: number | null = null;
  editingQuizId: number | null = null;
  showForm = false;

  constructor(
    private fb: FormBuilder,
    private admin: AdminService,
    private coursesSvc: CoursesService,
    private errHandler: ErrorHandlerService,
    private toastr: ToastrService
  ) {
    this.form = this.fb.group({
      quizId: [null],
      courseId: [null, Validators.required],
      quizTitle: ['', Validators.required],
      description: [''],
      passingScore: [70, [Validators.required, Validators.min(0), Validators.max(100)]],
      timeLimit: [10, [Validators.required, Validators.min(1)]],
      isActive: [true],
      questions: this.fb.array([])
    });
    this.coursesSvc.getCourses().subscribe({
      next: c => this.courses = c,
      error: err => this.setError(err)
    });
  }

  get questions(): FormArray {
    return this.form.get('questions') as FormArray;
  }

  createQuestion(): FormGroup {
    return this.fb.group({
      questionText: ['', Validators.required],
      questionType: [0, Validators.required],
      orderIndex: [this.questions.length + 1],
      answers: this.fb.array([this.createAnswer(), this.createAnswer()])
    });
  }

  createAnswer(): FormGroup {
    return this.fb.group({
      answerText: ['', Validators.required],
      isCorrect: [false],
      orderIndex: [0]
    });
  }

  addQuestion() {
    this.questions.push(this.createQuestion());
    
    // Automatically expand the newly added question
    setTimeout(() => {
      const accordionItems = document.querySelectorAll('.admin-accordion-item');
      if (accordionItems.length > 0) {
        const lastItem = accordionItems[accordionItems.length - 1];
        const header = lastItem.querySelector('.admin-accordion-header');
        if (header) {
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          });
          header.dispatchEvent(event);
        }
      }
    }, 0);
  }

  deleteQuestion(index: number) {
    this.questions.removeAt(index);
    this.questions.controls.forEach((q, i) => {
      q.get('orderIndex')?.setValue(i + 1);
    });
  }

  getAnswers(questionIndex: number): FormArray {
    return this.questions.at(questionIndex).get('answers') as FormArray;
  }

  addAnswer(questionIndex: number) {
    const answers = this.getAnswers(questionIndex);
    const qg = this.questions.at(questionIndex) as FormGroup;
    const type = Number(qg.get('questionType')?.value);
    if (type === 1 && answers.length >= 2) {
      this.toastr.warning('سؤال صح/خطأ يحتوي على خيارين فقط');
      return;
    }
    const answer = this.createAnswer();
    answer.get('orderIndex')?.setValue(answers.length + 1);
    answers.push(answer);
  }

  deleteAnswer(questionIndex: number, answerIndex: number) {
    const answers = this.getAnswers(questionIndex);
    if (answers.length > 2) {
      answers.removeAt(answerIndex);
      answers.controls.forEach((a, i) => {
        a.get('orderIndex')?.setValue(i + 1);
      });
    } else {
      this.toastr.warning('يجب أن يكون هناك خياران على الأقل');
    }
  }

  onCourseChange() {
    const courseId = this.selectedCourseId;
    this.form.patchValue({ courseId });
    if (!courseId) {
      this.quizzesForCourse = [];
      return;
    }
    this.admin.getQuizzesByCourse(courseId).subscribe({
      next: q => this.quizzesForCourse = q,
      error: err => this.setError(err)
    });
  }

  editQuiz(quiz: Quiz) {
    this.admin.getQuiz(quiz.quizId).subscribe({
      next: (data) => {
        if (data) {
          this.editingQuizId = quiz.quizId;
          this.showForm = true;
          this.form.patchValue({
            quizId: quiz.quizId,
            courseId: data.courseId || quiz.courseId,
            quizTitle: data.quizTitle || quiz.quizTitle,
            description: data.description || quiz.description,
            passingScore: data.passingScore !== undefined ? data.passingScore : quiz.passingScore,
            timeLimit: data.timeLimit !== undefined ? data.timeLimit : quiz.timeLimit,
            isActive: data.isActive !== undefined ? data.isActive : quiz.isActive
          });
          this.questions.clear();
          
          // Load questions if available
          if (data.questions && Array.isArray(data.questions)) {
            data.questions.forEach((q: any, index: number) => {
              const qg = this.fb.group({
                questionText: [q.questionText || '', Validators.required],
                questionType: [q.questionType ?? 0, Validators.required],
                orderIndex: [q.orderIndex || index + 1],
                answers: this.fb.array(
                  (q.answers || []).map((a: any, ansIndex: number) =>
                    this.fb.group({
                      answerText: [a.answerText || '', Validators.required],
                      isCorrect: [a.isCorrect || false],
                      orderIndex: [a.orderIndex || ansIndex + 1]
                    })
                  )
                )
              });
              this.questions.push(qg);
            });
          }
        }
      },
      error: err => this.setError(err)
    });
  }

  cancelEdit() {
    this.editingQuizId = null;
    this.showForm = false;
    this.resetForm();
  }

  // Add this method to handle accordion toggle
  toggleAccordion(event: Event) {
    const button = event.currentTarget as HTMLElement;
    const accordionItem = button.closest('.admin-accordion-item');
    if (accordionItem) {
      const body = accordionItem.querySelector('.admin-accordion-body');
      const icon = button.querySelector('.admin-accordion-icon');
      
      if (body && icon) {
        const isExpanded = body.classList.contains('show');
        
        // Close all other accordion items
        const allAccordionItems = document.querySelectorAll('.admin-accordion-item');
        allAccordionItems.forEach(item => {
          if (item !== accordionItem) {
            const otherBody = item.querySelector('.admin-accordion-body');
            const otherIcon = item.querySelector('.admin-accordion-icon');
            if (otherBody) otherBody.classList.remove('show');
            if (otherIcon) otherIcon.classList.remove('rotated');
          }
        });
        
        // Toggle current item
        if (isExpanded) {
          body.classList.remove('show');
          icon.classList.remove('rotated');
        } else {
          body.classList.add('show');
          icon.classList.add('rotated');
        }
      }
    }
  }

  submit() {
    if (this.form.invalid) {
      this.toastr.error('يرجى ملء جميع الحقول المطلوبة');
      return;
    }
    const formValue = this.form.value;
    this.loading = true;

    // For update, send nested payload (questions included)
    if (this.editingQuizId) {
      const updatePayload = {
        courseId: formValue.courseId,
        quizTitle: formValue.quizTitle,
        description: formValue.description || '',
        totalQuestions: formValue.questions ? formValue.questions.length : 0,
        passingScore: formValue.passingScore,
        timeLimit: formValue.timeLimit,
        isActive: formValue.isActive,
        questions: (formValue.questions || []).map((q: any) => this.normalizeQuestionPayload(q))
      };
      console.log('Updating quiz payload:', updatePayload);
      this.admin.updateQuiz(this.editingQuizId, updatePayload).subscribe({
        next: () => {
          this.loading = false;
          this.success('تم تحديث الكويز بنجاح');
          this.toastr.success('تم تحديث الكويز بنجاح');
          this.onCourseChange();
          this.resetForm();
          this.editingQuizId = null;
          this.showForm = false;
        },
        error: (err: any) => {
          this.loading = false;
          this.setError(err);
          this.toastr.error('فشل تحديث الكويز');
        }
      });
      return;
    }

    // For create, use sequential approach: create quiz, then create questions with answers
    const createQuizPayload = {
      courseId: formValue.courseId,
      quizTitle: formValue.quizTitle,
      description: formValue.description || '',
      totalQuestions: formValue.questions ? formValue.questions.length : 0,
      passingScore: formValue.passingScore,
      timeLimit: formValue.timeLimit,
      isActive: formValue.isActive
    };

    console.log('Creating quiz payload:', createQuizPayload);
    this.admin.addQuiz(createQuizPayload).subscribe({
      next: (createdQuiz: any) => {
        const quizId = createdQuiz.quizId ?? createdQuiz.id;
        console.log('Quiz created with ID:', quizId);
        
        // Now create each question with its answers sequentially
        this.createQuestionsSequentially(quizId, formValue.questions || [], 0);
      },
      error: (err: any) => {
        this.loading = false;
        this.setError(err);
        this.toastr.error('فشل إنشاء الكويز');
      }
    });
  }

  private createQuestionsSequentially(quizId: number, questions: any[], index: number) {
    // If all questions are created, finish
    if (index >= questions.length) {
      this.loading = false;
      this.success('تم إضافة الكويز والأسئلة بنجاح');
      this.toastr.success('تم إضافة الكويز والأسئلة بنجاح');
      this.onCourseChange();
      this.resetForm();
      this.showForm = false;
      return;
    }

    const q = questions[index];
    const questionPayload = this.normalizeQuestionPayload(q);

    console.log(`Creating question ${index + 1}/${questions.length} for quiz ${quizId}:`, questionPayload);
    this.admin.addQuestion(quizId, questionPayload).subscribe({
      next: () => {
        console.log(`Question ${index + 1} created successfully`);
        // Create next question
        this.createQuestionsSequentially(quizId, questions, index + 1);
      },
      error: (err: any) => {
        this.loading = false;
        console.error(`Failed to create question ${index + 1}:`, err);
        this.setError(err);
        this.toastr.error(`فشل إضافة السؤال ${index + 1}`);
      }
    });
  }

  onQuestionTypeChange(index: number) {
    const qg = this.questions.at(index) as FormGroup;
    const type = Number(qg.get('questionType')?.value);
    if (type === 1) {
      const answers = qg.get('answers') as FormArray;
      while (answers.length > 2) {
        answers.removeAt(answers.length - 1);
      }
      if (answers.length < 2) {
        while (answers.length < 2) answers.push(this.createAnswer());
      }
      const a0 = answers.at(0) as FormGroup;
      const a1 = answers.at(1) as FormGroup;
      a0.get('answerText')?.setValue(a0.get('answerText')?.value || 'true');
      a1.get('answerText')?.setValue(a1.get('answerText')?.value || 'false');
      const hasTrue = !!a0.get('isCorrect')?.value || !!a1.get('isCorrect')?.value;
      if (!hasTrue) a0.get('isCorrect')?.setValue(true);
      if (!!a0.get('isCorrect')?.value && !!a1.get('isCorrect')?.value) a1.get('isCorrect')?.setValue(false);
      a0.get('orderIndex')?.setValue(0);
      a1.get('orderIndex')?.setValue(1);
    }
  }

  onToggleCorrectTF(questionIndex: number, answerIndex: number) {
    const qg = this.questions.at(questionIndex) as FormGroup;
    const type = Number(qg.get('questionType')?.value);
    if (type !== 1) return;
    const answers = qg.get('answers') as FormArray;
    answers.controls.forEach((ctrl, i) => {
      if (i !== answerIndex) (ctrl as FormGroup).get('isCorrect')?.setValue(false, { emitEvent: false });
    });
  }

  private normalizeQuestionPayload(q: any) {
    const type = Number(q.questionType);
    let answers = (q.answers || []).map((a: any, i: number) => ({
      answerText: a.answerText,
      isCorrect: !!a.isCorrect,
      orderIndex: a.orderIndex ?? i + 1
    }));
    if (type === 1) {
      answers = answers.slice(0, 2);
      while (answers.length < 2) {
        answers.push({ answerText: answers.length === 0 ? 'true' : 'false', isCorrect: answers.length === 0, orderIndex: answers.length });
      }
      const firstTrueIndex = answers.findIndex((a: any) => a.isCorrect);
      answers = answers.map((a: any, i: number) => ({ ...a, isCorrect: i === (firstTrueIndex >= 0 ? firstTrueIndex : 0), orderIndex: i, answerText: a.answerText || (i === 0 ? 'true' : 'false') }));
    } else {
      if (!answers.some((a: any) => a.isCorrect)) {
        answers = answers.map((a: any, i: number) => ({ ...a, isCorrect: i === 0, orderIndex: i }));
      } else {
        answers = answers.map((a: any, i: number) => ({ ...a, orderIndex: i }));
      }
      if (answers.length < 2) {
        answers.push({ answerText: 'خيار', isCorrect: false, orderIndex: answers.length });
      }
    }
    return {
      questionText: q.questionText,
      questionType: type,
      orderIndex: q.orderIndex,
      answers
    };
  }

  deleteQuiz(id: number) {
    if (!confirm('هل أنت متأكد من حذف هذا الكويز؟')) return;

    this.loading = true;
    this.admin.deleteQuiz(id).subscribe({
      next: () => {
        this.loading = false;
        this.success('تم حذف الكويز');
        this.toastr.success('تم حذف الكويز');
        this.onCourseChange();
      },
      error: err => {
        this.loading = false;
        // Check if it's the specific error about existing attempts (Arabic message has priority)
        const errorMessage = err && err.message ? err.message : (err && typeof err === 'string' ? err : 'فشل الحذف');
        
        if (errorMessage.includes('لا يمكن حذف الكويز لأنه يحتوي على محاولات سابقة')) {
          this.errorMsg = 'لا يمكن حذف الكويز لأنه يحتوي على محاولات سابقة';
          this.successMsg = '';
          this.toastr.error('لا يمكن حذف الكويز لأنه يحتوي على محاولات سابقة');
        } else {
          this.errorMsg = errorMessage;
          this.successMsg = '';
          this.toastr.error(errorMessage);
        }
      }
    });
  }

  resetForm() {
    this.form.reset({
      courseId: this.selectedCourseId,
      passingScore: 70,
      timeLimit: 10,
      isActive: true
    });
    this.questions.clear();
  }

  private setError(err: any) {
    this.loading = false;
    console.error('AdminQuizzes error:', err);
    // Try to extract server validation details when available
    let msg = this.errHandler.getErrorMessage(err);
    if (err && err.error) {
      // API often returns structured error: { success, message, data, errors }
      if (err.error.message) msg = err.error.message;
      if (err.error.errors && Array.isArray(err.error.errors) && err.error.errors.length) {
        msg = err.error.errors.join(' | ');
      }
      // sometimes validation details are in err.error or err.error.data
      if (!msg && err.error.data) msg = JSON.stringify(err.error.data);
    }
    this.errorMsg = msg;
    this.successMsg = '';
    this.toastr.error(msg || 'حدث خطأ غير متوقع');
  }

  private success(msg: string) {
    this.errorMsg = '';
    this.successMsg = msg;
  }
}
