import { Component, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { NgIf, NgForOf } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { QuizzesService, StartQuizData, SubmitQuizRequest, SubmitQuizResult } from '../../services/quizzes.service';
import { ErrorHandlerService } from '../../core/error-handler.service';
import { ToastrService } from 'ngx-toastr';
import { Quiz } from '../../models/entities';

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

  constructor(private route: ActivatedRoute, private router: Router, private quizzes: QuizzesService, private fb: FormBuilder, private errHandler: ErrorHandlerService, private toastr: ToastrService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    if (!id || isNaN(id)) {
      this.errorMsg = 'معرف الكويز غير صالح';
      this.loading = false;
      return;
    }
    
    this.quizzes.startQuiz(id).subscribe({
      next: data => {
        this.startData = data;
        this.quiz = { quizId: data.quizId, courseId: 0, quizTitle: data.quizTitle, description: '', totalQuestions: data.questions.length, passingScore: 0, timeLimit: data.timeLimit, isActive: true } as Quiz;
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
        this.toastr.error(msg);
      }
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

  ngOnDestroy() {
    this.stopTimer();
  }
}