import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgForOf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { QuizzesService, StartQuizData, SubmitQuizRequest, SubmitQuizResult } from '../../services/quizzes.service';
import { AuthService } from '../../services/auth.service';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { ToastrService } from 'ngx-toastr';
import { Quiz, User } from '../../models/entities';

@Component({
  selector: 'app-quiz',
  standalone: true,
  imports: [NgIf, NgForOf, ReactiveFormsModule, RouterLink],
  templateUrl: './quiz.component.html',
  styleUrls: ['./quiz.component.css']
})
export class QuizComponent implements OnDestroy {
  quiz?: Quiz;
  startData?: StartQuizData;
  form!: FormGroup;
  result?: SubmitQuizResult;
  errorMsg = '';
  loading = true;
  timeRemaining = 0;
  timerInterval: any;
  quizSubmitted = false;

  currentUser?: User;
  
  constructor(private route: ActivatedRoute, private router: Router, private quizzes: QuizzesService, private fb: FormBuilder, private errHandler: ErrorHandlerService, private toastr: ToastrService, private authService: AuthService) {
    // Load current user first
    this.authService.me().subscribe(user => {
      this.currentUser = user;
      console.log('Current user loaded:', user);
      
      const id = Number(this.route.snapshot.paramMap.get('id'));
      if (!id || isNaN(id)) {
        this.errorMsg = 'معرف الكويز غير صالح';
        this.loading = false;
        return;
      }
      
      // Directly start the quiz to get both quiz details and questions
      this.quizzes.startQuiz(id).subscribe({
        next: data => {
          // Create a quiz object from the start data
          this.quiz = {
            quizId: data.quizId,
            courseId: 0, // We'll need to get this from somewhere else or extract it
            quizTitle: data.quizTitle,
            description: '',
            totalQuestions: data.questions.length,
            passingScore: 0, // We'll need to get this from somewhere else
            timeLimit: data.timeLimit,
            isActive: true
          };
          
          this.startData = data;
          const controls: any = {};
          // questionType mapping: 0 = multiple choice (single answer), 1 = true/false
          // both types use a single selected value (radio). Initialize controls to null.
          data.questions.forEach(q => { controls['q_' + q.id] = this.fb.control(null); });
          this.form = this.fb.group(controls);
          this.timeRemaining = data.timeLimit * 60;
          this.startTimer();
          this.loading = false;
        },
        error: (err) => {
          this.loading = false;
          const msg = this.errHandler.getErrorMessage(err);
          this.errorMsg = msg;
          // Handle specific case when quiz is not found
          if (err.status === 404) {
            this.errorMsg = 'الكويز غير متوفر أو تم حذفه';
          }
          this.toastr.error(msg);
        }
      });
    });
  }

  private getAttemptId(): number { return this.startData?.attemptId ?? 0; }

  submit() {
    if (!this.startData || !this.form || this.quizSubmitted) return;
    this.quizSubmitted = true;
    this.stopTimer();
    const responses = this.form.value;
    const payload: SubmitQuizRequest = {
      attemptId: this.getAttemptId(),
      answers: this.startData.questions.map(q => {
        const value = responses['q_' + q.id];
        return {
          questionId: q.id,
          selectedAnswerIds: Array.isArray(value) ? value : (value != null ? [value] : [])
        };
      })
    };
    this.quizzes.submitQuiz(this.startData.quizId, payload).subscribe({
      next: res => { 
        this.result = res; 
        this.toastr.success('تم إرسال الإجابات بنجاح');
        
        // Mark quiz as passed if successful
        if (res.isPassed) {
          this.markQuizAsPassed(res.quizId);
        }
      },
      error: err => { 
        this.quizSubmitted = false;
        const msg = this.errHandler.getErrorMessage(err); 
        this.errorMsg = msg; 
        this.toastr.error(msg); 
      }
    });
  }

  getAnswersFor(questionId: number): { id: number; answerText: string; orderIndex: number }[] {
    const q = this.startData?.questions.find(q => q.id === questionId);
    return q?.answers ?? [];
  }

  toggleCheckbox(questionId: number, answerId: number) {
    const ctrl = this.form.get('q_' + questionId);
    const current: number[] = (ctrl?.value || []).slice();
    const exists = current.includes(answerId);
    const next = exists ? current.filter(v => v !== answerId) : [...current, answerId];
    ctrl?.setValue(next);
  }

  startTimer() {
    this.timerInterval = setInterval(() => {
      if (this.timeRemaining > 0) {
        this.timeRemaining--;
      } else {
        this.toastr.warning('انتهى الوقت! سيتم إرسال إجاباتك تلقائياً');
        this.submit();
      }
    }, 1000);
  }

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  getFormattedTime(): string {
    const minutes = Math.floor(this.timeRemaining / 60);
    const seconds = this.timeRemaining % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }

  retryQuiz() {
    if (this.quiz?.quizId) {
      this.router.navigate(['/quizzes', this.quiz.quizId]);
      window.location.reload();
    }
  }

  /**
   * Mark quiz as passed in localStorage
   */
  markQuizAsPassed(quizId: number) {
    try {
      // Get course ID from quiz object
      const courseId = this.quiz?.courseId;
      const userId = this.currentUser?.userId || 0;
      if (courseId) {
        const passedQuizzesKey = `user_${userId}_course_${courseId}_passed_quizzes`;
        const passedQuizzes = JSON.parse(localStorage.getItem(passedQuizzesKey) || '[]');
        if (!passedQuizzes.includes(quizId)) {
          passedQuizzes.push(quizId);
          localStorage.setItem(passedQuizzesKey, JSON.stringify(passedQuizzes));
        }
      }
    } catch (e) {
      console.error('Error saving passed quiz to localStorage:', e);
    }
  }

  ngOnDestroy() {
    this.stopTimer();
  }
}