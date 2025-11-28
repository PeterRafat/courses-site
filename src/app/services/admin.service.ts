import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Course, CourseVideo, Quiz, User, Question, Answer } from '../models/entities';
import { USE_MOCK, mockUsers, mockCourses, mockVideos, mockQuizzes, mockQuestions, mockAnswers } from '../mock/mock-data';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  createCourse(body: Partial<Course>): Observable<Course> {
    if (USE_MOCK) {
      const created: Course = {
        courseId: (mockCourses.at(-1)?.courseId ?? 0) + 1,
        courseName: body.courseName ?? 'New Course',
        courseImage: body.courseImage ?? '',
        description: body.description ?? '',
        price: body.price ?? 0,
        isFree: !!body.isFree,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockCourses.push(created);
      return of(created);
    }
    return this.http.post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/courses`, body).pipe(
      map(res => ({
        courseId: res?.data?.id ?? 0,
        courseName: res?.data?.courseName ?? body.courseName ?? '',
        courseImage: res?.data?.courseImage ?? body.courseImage ?? '',
        description: res?.data?.description ?? body.description ?? '',
        price: res?.data?.price ?? body.price ?? 0,
        isFree: res?.data?.isFree ?? !!body.isFree,
        createdAt: res?.data?.createdAt ?? new Date().toISOString(),
        updatedAt: res?.data?.updatedAt ?? new Date().toISOString()
      } as Course))
    );
  }

  updateCourse(courseId: number, body: Partial<Course>): Observable<Course> {
    if (USE_MOCK) {
      const idx = mockCourses.findIndex(c => c.courseId === courseId);
      if (idx >= 0) {
        mockCourses[idx] = { ...mockCourses[idx], ...body, updatedAt: new Date().toISOString() } as Course;
        return of(mockCourses[idx]);
      }
      return of({
        courseId,
        courseName: body.courseName ?? 'Updated',
        courseImage: body.courseImage ?? '',
        description: body.description ?? '',
        price: body.price ?? 0,
        isFree: !!body.isFree,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/courses/${courseId}`, body)
      .pipe(
        map(res => ({
          courseId: res?.data?.id ?? courseId,
          courseName: res?.data?.courseName ?? body.courseName ?? '',
          courseImage: res?.data?.courseImage ?? body.courseImage ?? '',
          description: res?.data?.description ?? body.description ?? '',
          price: res?.data?.price ?? body.price ?? 0,
          isFree: res?.data?.isFree ?? !!body.isFree,
          createdAt: res?.data?.createdAt ?? new Date().toISOString(),
          updatedAt: res?.data?.updatedAt ?? new Date().toISOString()
        } as Course))
      );
  }

  createCourseUpload(params: { courseName: string; description?: string; price: number; isFree: boolean }, imageFile: File): Observable<Course> {
    if (USE_MOCK) {
      const created: Course = {
        courseId: (mockCourses.at(-1)?.courseId ?? 0) + 1,
        courseName: params.courseName,
        courseImage: 'mock://uploaded-image',
        description: params.description ?? '',
        price: params.price,
        isFree: params.isFree,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      mockCourses.push(created);
      return of(created);
    }
    const form = new FormData();
    form.append('courseName', params.courseName);
    if (params.description) form.append('description', params.description);
    form.append('price', String(params.price));
    form.append('isFree', String(params.isFree));
    form.append('courseImage', imageFile);
    return this.http
      .post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/courses/upload`, form)
      .pipe(
        map(res => ({
          courseId: res?.data?.id ?? 0,
          courseName: res?.data?.courseName ?? params.courseName,
          courseImage: res?.data?.courseImage ?? '',
          description: res?.data?.description ?? params.description ?? '',
          price: res?.data?.price ?? params.price,
          isFree: res?.data?.isFree ?? params.isFree,
          createdAt: res?.data?.createdAt ?? new Date().toISOString(),
          updatedAt: res?.data?.updatedAt ?? new Date().toISOString()
        } as Course))
      );
  }

  updateCourseUpload(id: number, params: { courseName: string; description?: string; price: number; isFree: boolean }, imageFile: File): Observable<Course> {
    if (USE_MOCK) {
      const idx = mockCourses.findIndex(c => c.courseId === id);
      const updated: Course = {
        courseId: id,
        courseName: params.courseName,
        courseImage: 'mock://uploaded-image',
        description: params.description ?? '',
        price: params.price,
        isFree: params.isFree,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      if (idx >= 0) mockCourses[idx] = updated; else mockCourses.push(updated);
      return of(updated);
    }
    const form = new FormData();
    form.append('courseName', params.courseName);
    if (params.description) form.append('description', params.description);
    form.append('price', String(params.price));
    form.append('isFree', String(params.isFree));
    form.append('courseImage', imageFile);
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/courses/${id}/upload`, form)
      .pipe(
        map(res => ({
          courseId: res?.data?.id ?? id,
          courseName: res?.data?.courseName ?? params.courseName,
          courseImage: res?.data?.courseImage ?? '',
          description: res?.data?.description ?? params.description ?? '',
          price: res?.data?.price ?? params.price,
          isFree: res?.data?.isFree ?? params.isFree,
          createdAt: res?.data?.createdAt ?? new Date().toISOString(),
          updatedAt: res?.data?.updatedAt ?? new Date().toISOString()
        } as Course))
      );
  }

  deleteCourse(id: number): Observable<string> {
    if (USE_MOCK) {
      const idx = mockCourses.findIndex(c => c.courseId === id);
      if (idx >= 0) mockCourses.splice(idx, 1);
      return of('deleted');
    }
    const headers = new HttpHeaders({ Accept: 'application/json, text/plain, */*' });
    return this.http
      .delete(`${this.baseUrl}/admin/courses/${id}`, { headers, observe: 'response', responseType: 'text' })
      .pipe(
        map(resp => {
          const text = resp.body ?? '';
          let body: any = text;
          try { body = JSON.parse(text); } catch {}
          const success = body?.success ?? body?.Success;
          const message = body?.message ?? body?.Message;
          if (success === false) {
            throw new Error(message || 'لا يمكن الحذف لوجود مستخدمين مسجلين');
          }
          return body?.data ?? 'deleted';
        })
      );
  }

  deactivateCourse(courseId: number): Observable<void> {
    if (USE_MOCK) {
      const idx = mockCourses.findIndex(c => c.courseId === courseId);
      if (idx >= 0) mockCourses[idx] = { ...mockCourses[idx], updatedAt: new Date().toISOString() };
      return of(void 0);
    }
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const payload: any = { isActive: false };
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/courses/${courseId}`, payload, { headers })
      .pipe(map(() => void 0));
  }

  getCourses(): Observable<Course[]> {
    if (USE_MOCK) return of(mockCourses);
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/admin/courses`)
      .pipe(
        map(res => 
          (res?.data ?? []).map(item => ({
            courseId: item.id ?? 0,
            courseName: item.courseName ?? '',
            courseImage: item.courseImage ?? '',
            description: item.description ?? '',
            price: item.price ?? 0,
            isFree: item.isFree ?? false,
            createdAt: item.createdAt ?? new Date().toISOString(),
            updatedAt: item.updatedAt ?? new Date().toISOString(),
            videoCount: item.videoCount ?? 0,
            quizCount: item.quizCount ?? 0
          } as Course))
        ),
        catchError((err: any) => {
          console.error('getAdminCourses error', err);
          // Return empty array instead of throwing error to prevent app crash
          return of([]);
        })
      );
  }

  addVideo(courseId: number, body: Partial<CourseVideo>): Observable<CourseVideo> {
    if (USE_MOCK) {
      const created: CourseVideo = {
        videoId: Math.floor(Math.random() * 10000),
        courseId,
        videoTitle: body.videoTitle ?? 'New Video',
        videoUrl: body.videoUrl ?? '#',
        duration: body.duration ?? 0,
        orderIndex: body.orderIndex ?? 1
      };
      mockVideos.push(created);
      return of(created);
    }
    const payload = {
      courseId,
      videoTitle: body.videoTitle ?? '',
      videoUrl: body.videoUrl ?? '',
      duration: body.duration ?? 0,
      orderIndex: body.orderIndex ?? 1
    };
    return this.http.post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/videos`, payload)
      .pipe(map(res => ({
        videoId: res?.data?.id ?? 0,
        courseId: res?.data?.courseId ?? courseId,
        videoTitle: res?.data?.videoTitle ?? payload.videoTitle,
        videoUrl: res?.data?.videoUrl ?? payload.videoUrl,
        duration: res?.data?.duration ?? payload.duration,
        orderIndex: res?.data?.orderIndex ?? payload.orderIndex
      } as CourseVideo)));
  }

  uploadVideo(params: { courseId: number; videoTitle: string; duration: number; orderIndex: number }, file: File): Observable<CourseVideo> {
    if (USE_MOCK) {
      const created: CourseVideo = {
        videoId: Math.floor(Math.random() * 10000),
        courseId: params.courseId,
        videoTitle: params.videoTitle,
        videoUrl: 'mock://uploaded-video',
        duration: params.duration,
        orderIndex: params.orderIndex
      };
      mockVideos.push(created);
      return of(created);
    }
    const form = new FormData();
    form.append('courseId', String(params.courseId));
    form.append('videoTitle', params.videoTitle);
    form.append('duration', String(params.duration));
    form.append('orderIndex', String(params.orderIndex));
    form.append('videoFile', file);
    return this.http.post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/videos/upload`, form)
      .pipe(map(res => ({
        videoId: res?.data?.id ?? 0,
        courseId: res?.data?.courseId ?? params.courseId,
        videoTitle: res?.data?.videoTitle ?? params.videoTitle,
        videoUrl: res?.data?.videoUrl ?? '',
        duration: res?.data?.duration ?? params.duration,
        orderIndex: res?.data?.orderIndex ?? params.orderIndex
      } as CourseVideo)));
  }

  getVideosByCourse(courseId: number): Observable<CourseVideo[]> {
    if (USE_MOCK) return of(mockVideos.filter(v => v.courseId === courseId));
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/admin/videos/courses/${courseId}`)
      .pipe(
        map(res => (res?.data ?? []).map(item => ({
          videoId: item.id ?? 0,
          courseId: item.courseId ?? courseId,
          videoTitle: item.videoTitle ?? '',
          videoUrl: item.videoUrl ?? '',
          duration: item.duration ?? 0,
          orderIndex: item.orderIndex ?? 1
        } as CourseVideo)))
      );
  }

  updateVideo(id: number, body: Partial<CourseVideo>): Observable<CourseVideo> {
    if (USE_MOCK) {
      const idx = mockVideos.findIndex(v => v.videoId === id);
      if (idx >= 0) {
        mockVideos[idx] = { ...mockVideos[idx], ...body } as CourseVideo;
        return of(mockVideos[idx]);
      }
      return of({
        videoId: id,
        courseId: body.courseId ?? 0,
        videoTitle: body.videoTitle ?? '',
        videoUrl: body.videoUrl ?? '',
        duration: body.duration ?? 0,
        orderIndex: body.orderIndex ?? 1
      } as CourseVideo);
    }
    const payload = {
      courseId: body.courseId ?? 0,
      videoTitle: body.videoTitle ?? '',
      videoUrl: body.videoUrl ?? '',
      duration: body.duration ?? 0,
      orderIndex: body.orderIndex ?? 1
    };
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/videos/${id}`, payload)
      .pipe(
        map(res => ({
          videoId: res?.data?.id ?? id,
          courseId: res?.data?.courseId ?? payload.courseId,
          videoTitle: res?.data?.videoTitle ?? payload.videoTitle,
          videoUrl: res?.data?.videoUrl ?? payload.videoUrl,
          duration: res?.data?.duration ?? payload.duration,
          orderIndex: res?.data?.orderIndex ?? payload.orderIndex
        } as CourseVideo))
      );
  }

  deleteVideo(id: number): Observable<string> {
    if (USE_MOCK) {
      const idx = mockVideos.findIndex(v => v.videoId === id);
      if (idx >= 0) mockVideos.splice(idx, 1);
      return of('deleted');
    }
    return this.http
      .delete<{ success: boolean; message: string; data: string; errors: string[] }>(`${this.baseUrl}/admin/videos/${id}`)
      .pipe(map(res => res?.data ?? ''));
  }

  addQuiz(body: { courseId: number; quizTitle: string; description: string; totalQuestions: number; passingScore: number; timeLimit: number; isActive: boolean; questions?: { questionText: string; questionType: number; orderIndex: number; answers: { answerText: string; isCorrect: boolean; orderIndex: number }[] }[] }): Observable<Quiz> {
    if (USE_MOCK) {
      const created: Quiz = {
        quizId: Math.floor(Math.random() * 10000),
        courseId: body.courseId,
        quizTitle: body.quizTitle ?? 'New Quiz',
        description: body.description ?? '',
        totalQuestions: body.totalQuestions ?? 0,
        passingScore: body.passingScore ?? 0,
        timeLimit: body.timeLimit ?? 0,
        isActive: body.isActive ?? true
      };
      mockQuizzes.push(created);
      return of(created);
    }
    return this.http
      .post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes`, body)
      .pipe(
        map((res) => ({
          quizId: res?.data?.id ?? 0,
          courseId: res?.data?.courseId ?? body.courseId,
          quizTitle: res?.data?.quizTitle ?? body.quizTitle,
          description: res?.data?.description ?? body.description,
          totalQuestions: res?.data?.totalQuestions ?? body.totalQuestions,
          passingScore: res?.data?.passingScore ?? body.passingScore,
          timeLimit: res?.data?.timeLimit ?? body.timeLimit,
          isActive: res?.data?.isActive ?? body.isActive
        } as Quiz))
      );
  }

  addQuestion(quizId: number, body: { questionText: string; questionType: number; orderIndex: number; answers: { answerText: string; isCorrect: boolean; orderIndex: number }[] }): Observable<any> {
    if (USE_MOCK) {
      const created: Question = {
        questionId: Math.floor(Math.random() * 10000),
        quizId,
        questionText: body.questionText ?? 'New Question',
        questionType: body.questionType ?? 0,
        orderIndex: body.orderIndex ?? 1
      };
      mockQuestions.push(created);
      const qz = mockQuizzes.find(q => q.quizId === quizId);
      if (qz) qz.totalQuestions = mockQuestions.filter(q => q.quizId === quizId).length;
      return of(created);
    }
    return this.http
      .post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes/${quizId}/questions`, body)
      .pipe(map(res => res?.data));
  }

  getQuestions(quizId: number): Observable<any[]> {
    if (USE_MOCK) {
      return of(mockQuestions.filter(q => q.quizId === quizId).map(q => ({
        ...q,
        answers: mockAnswers.filter(a => a.questionId === q.questionId)
      })));
    }
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/admin/quizzes/${quizId}/questions`)
      .pipe(map(res => res?.data ?? []));
  }

  updateQuestion(questionId: number, body: { questionText: string; questionType: number; orderIndex: number; answers: { answerText: string; isCorrect: boolean; orderIndex: number }[] }): Observable<any> {
    if (USE_MOCK) {
      const idx = mockQuestions.findIndex(q => q.questionId === questionId);
      if (idx >= 0) {
        mockQuestions[idx] = { ...mockQuestions[idx], ...body };
      }
      return of(mockQuestions[idx]);
    }
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes/questions/${questionId}`, body)
      .pipe(map(res => res?.data));
  }

  deleteQuestion(questionId: number): Observable<string> {
    if (USE_MOCK) {
      const idx = mockQuestions.findIndex(q => q.questionId === questionId);
      if (idx >= 0) mockQuestions.splice(idx, 1);
      return of('deleted');
    }
    return this.http
      .delete<{ success: boolean; message: string; data: string; errors: string[] }>(`${this.baseUrl}/admin/quizzes/questions/${questionId}`)
      .pipe(map(res => res?.data ?? ''));
  }

  getQuizzesByCourse(courseId: number): Observable<Quiz[]> {
    if (USE_MOCK) return of(mockQuizzes.filter(q => q.courseId === courseId));
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/admin/quizzes/courses/${courseId}`)
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
        )
      );
  }

  getQuiz(id: number): Observable<any> {
    if (USE_MOCK) {
      const quiz = mockQuizzes.find(q => q.quizId === id);
      if (quiz) {
        return of({
          ...quiz,
          questions: mockQuestions.filter(q => q.quizId === id).map(q => ({
            questionId: q.questionId,
            questionText: q.questionText,
            questionType: q.questionType,
            orderIndex: q.orderIndex,
            answers: mockAnswers.filter(a => a.questionId === q.questionId).map(a => ({
              answerId: a.answerId,
              answerText: a.answerText,
              isCorrect: a.isCorrect,
              orderIndex: a.orderIndex
            }))
          }))
        });
      }
      return of(null);
    }
    return this.http
      .get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes/${id}`)
      .pipe(map(res => res?.data));
  }

  updateQuiz(id: number, body: { courseId: number; quizTitle: string; description: string; totalQuestions: number; passingScore: number; timeLimit: number; isActive: boolean; questions: { questionText: string; questionType: number; orderIndex: number; answers: { answerText: string; isCorrect: boolean; orderIndex: number }[] }[] }): Observable<Quiz> {
    if (USE_MOCK) {
      const idx = mockQuizzes.findIndex(q => q.quizId === id);
      if (idx >= 0) {
        mockQuizzes[idx] = {
          quizId: id,
          courseId: body.courseId,
          quizTitle: body.quizTitle,
          description: body.description,
          totalQuestions: body.totalQuestions,
          passingScore: body.passingScore,
          timeLimit: body.timeLimit,
          isActive: body.isActive
        } as Quiz;
      }
      return of(mockQuizzes[idx] ?? ({
        quizId: id,
        courseId: body.courseId,
        quizTitle: body.quizTitle,
        description: body.description,
        totalQuestions: body.totalQuestions,
        passingScore: body.passingScore,
        timeLimit: body.timeLimit,
        isActive: body.isActive
      } as Quiz));
    }
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes/${id}`, body)
      .pipe(
        map((res) => ({
          quizId: res?.data?.id ?? id,
          courseId: res?.data?.courseId ?? body.courseId,
          quizTitle: res?.data?.quizTitle ?? body.quizTitle,
          description: res?.data?.description ?? body.description,
          totalQuestions: res?.data?.totalQuestions ?? body.totalQuestions,
          passingScore: res?.data?.passingScore ?? body.passingScore,
          timeLimit: res?.data?.timeLimit ?? body.timeLimit,
          isActive: res?.data?.isActive ?? body.isActive
        } as Quiz)),
        catchError((err: any) => {
          console.error('updateQuiz error', err);
          throw err;
        })
      );
  }

  deleteQuiz(id: number): Observable<string> {
    if (USE_MOCK) {
      const idx = mockQuizzes.findIndex(q => q.quizId === id);
      if (idx >= 0) mockQuizzes.splice(idx, 1);
      return of('deleted');
    }
    const headers = new HttpHeaders({ Accept: 'application/json, text/plain, */*' });
    return this.http
      .delete(`${this.baseUrl}/admin/quizzes/${id}`, { headers, observe: 'response', responseType: 'text' })
      .pipe(
        map(resp => {
          const text = resp.body ?? '';
          let body: any = text;
          try { body = JSON.parse(text); } catch {}
          const success = body?.success ?? body?.Success;
          const message = body?.message ?? body?.Message;
          if (success === false) {
            // Check for the specific error about existing attempts
            if (message && message.includes('Cannot delete quiz with existing attempts')) {
              throw new Error('لا يمكن حذف الكويز لأنه يحتوي على محاولات سابقة');
            }
            throw new Error(message || 'فشل الحذف');
          }
          return body?.data ?? 'deleted';
        }),
        catchError((error: any) => {
          // Handle HTTP errors
          if (error && error.error) {
            let errorMessage = 'فشل الحذف';
            try {
              const errorBody = JSON.parse(error.error);
              const message = errorBody?.message ?? errorBody?.Message;
              if (message && message.includes('Cannot delete quiz with existing attempts')) {
                errorMessage = 'لا يمكن حذف الكويز لأنه يحتوي على محاولات سابقة';
              } else if (message) {
                errorMessage = message;
              }
            } catch {
              // If parsing fails, use the raw error message
              if (typeof error.error === 'string') {
                if (error.error.includes('Cannot delete quiz with existing attempts')) {
                  errorMessage = 'لا يمكن حذف الكويز لأنه يحتوي على محاولات سابقة';
                } else {
                  errorMessage = error.error;
                }
              }
            }
            throw new Error(errorMessage);
          }
          throw error;
        })
      );
  }

  assignCourseToUser(userId: number, courseId: number): Observable<void> {
    if (USE_MOCK) return of(void 0);
    return this.http.post<void>(`${this.baseUrl}/admin/users/${userId}/courses/${courseId}`, {});
  }

  getUsers(): Observable<User[]> {
    if (USE_MOCK) return of(mockUsers);
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/admin/users`)
      .pipe(
        map(res => (res?.data ?? []).map(item => ({
          userId: item.id ?? 0,
          fullName: item.fullName ?? '',
          email: item.email ?? '',
          phone: item.phone ?? '',
          role: item.role ?? '',
          isActive: item.isActive ?? true,
          createdAt: item.createdAt ?? new Date().toISOString()
        } as User))),
        catchError((err: any) => {
          console.error('getUsers error', err);
          // Return empty array instead of throwing error to prevent app crash
          return of([]);
        })
      );
  }
}
