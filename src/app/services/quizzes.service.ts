import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Quiz, Question, Answer, UserQuizAttempt } from '../models/entities';
import { USE_MOCK, mockQuizzes, mockQuestions, mockAnswers } from '../mock/mock-data';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from '../core/error-handler.service';

export interface SubmitAttemptRequest {
  quizId: number;
  answers: { questionId: number; answerId: number }[];
}

export interface StartQuizData {
  attemptId: number;
  quizId: number;
  quizTitle: string;
  timeLimit: number;
  startedAt: string;
  questions: {
    id: number;
    questionText: string;
    questionType: number;
    orderIndex: number;
    answers: { id: number; answerText: string; orderIndex: number }[];
  }[];
}

export interface SubmitQuizRequest {
  attemptId: number;
  answers: { questionId: number; selectedAnswerIds: number[] }[];
}

export interface SubmitQuizResult {
  id: number;
  userId: number;
  userFullName?: string;
  quizId: number;
  quizTitle?: string;
  startedAt: string;
  completedAt: string;
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  isPassed: boolean;
}

@Injectable({ providedIn: 'root' })
export class QuizzesService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {}

  getQuiz(quizId: number): Observable<Quiz> {
    if (USE_MOCK) return of(mockQuizzes.find(q => q.quizId === quizId)!);
    return this.http.get<Quiz>(`${this.baseUrl}/quizzes/${quizId}`).pipe(
      catchError(err => { this.errorHandler.showError(err, 'فشل تحميل الكويز'); return of({
        quizId,
        courseId: 0,
        quizTitle: 'غير متاح',
        description: '',
        totalQuestions: 0,
        passingScore: 0,
        timeLimit: 0,
        isActive: false
      } as Quiz); })
    );
  }

  getQuestions(quizId: number): Observable<Question[]> {
    if (USE_MOCK) return of(mockQuestions.filter(q => q.quizId === quizId));
    return this.http.get<Question[]>(`${this.baseUrl}/quizzes/${quizId}/questions`).pipe(
      catchError(err => { this.errorHandler.showError(err, 'فشل تحميل أسئلة الكويز'); return of([]); })
    );
  }

  getAnswers(quizId: number): Observable<Answer[]> {
    if (USE_MOCK) return of(mockAnswers.filter(a => mockQuestions.some(q => q.quizId === quizId && q.questionId === a.questionId)));
    return this.http.get<Answer[]>(`${this.baseUrl}/quizzes/${quizId}/answers`).pipe(
      catchError(err => { this.errorHandler.showError(err, 'فشل تحميل إجابات الكويز'); return of([]); })
    );
  }

  submitAttempt(body: SubmitAttemptRequest): Observable<{ attemptId: number }>
  {
    if (USE_MOCK) return of({ attemptId: Math.floor(Math.random() * 10000) });
    return this.http.post<{ attemptId: number }>(`${this.baseUrl}/quizzes/attempts`, body).pipe(
      catchError(err => { this.errorHandler.showError(err, 'فشل بدء المحاولة'); return of({ attemptId: -1 }); })
    );
  }

  startQuiz(quizId: number): Observable<StartQuizData> {
    return this.http
      .post<{ success: boolean; message: string; data: StartQuizData; errors: string[] }>(`${this.baseUrl}/Quizzes/${quizId}/start`, {})
      .pipe(map(res => res.data));
  }

  submitQuiz(quizId: number, body: SubmitQuizRequest): Observable<SubmitQuizResult> {
    if (USE_MOCK) {
      return of({
        id: body.attemptId,
        userId: 0,
        quizId,
        startedAt: new Date().toISOString(),
        completedAt: new Date().toISOString(),
        score: 100,
        correctAnswers: body.answers.length,
        totalQuestions: body.answers.length,
        isPassed: true
      });
    }
    return this.http
      .post<{ success: boolean; message: string; data: SubmitQuizResult; errors: string[] }>(`${this.baseUrl}/Quizzes/${quizId}/submit`, body)
      .pipe(map(res => res.data));
  }

  getAttemptsHistory(): Observable<SubmitQuizResult[]> {
    if (USE_MOCK) return of([]);
    return this.http
      .get<{ success: boolean; message: string; data: SubmitQuizResult[]; errors: string[] }>(`${this.baseUrl}/Quizzes/attempts/history`)
      .pipe(map(res => res.data ?? []));
  }

  getCourseAttempts(courseId: number): Observable<SubmitQuizResult[]> {
    if (USE_MOCK) return of([]);
    return this.http
      .get<{ success: boolean; message: string; data: SubmitQuizResult[]; errors: string[] }>(`${this.baseUrl}/Quizzes/courses/${courseId}/attempts`)
      .pipe(map(res => res.data ?? []));
  }

  getCourseQuizzes(courseId: number): Observable<Quiz[]> {
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/Quizzes/courses/${courseId}`)
      .pipe(
        map((res) =>
          (res?.data ?? []).map(
            (item) => ({
              quizId: item.id ?? 0,
              courseId: item.courseId ?? courseId,
              quizTitle: item.quizTitle ?? '',
              description: item.description ?? '',
              totalQuestions: item.totalQuestions ?? 0,
              passingScore: item.passingScore ?? 0,
              timeLimit: item.timeLimit ?? 0,
              isActive: item.isActive ?? true
            } as Quiz)
          )
        ),
        catchError((err) => { this.errorHandler.showError(err, 'فشل تحميل كويزات الكورس'); return of([]); })
      );
  }
}
