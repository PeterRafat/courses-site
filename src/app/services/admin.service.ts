import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, catchError } from 'rxjs';
import { map } from 'rxjs/operators';
import { Course, CourseVideo, Quiz, User, Question, Answer, ContactForm, ContactFormCreate } from '../models/entities';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient) {}

  createCourse(body: Partial<Course>): Observable<Course> {
    const headers = new HttpHeaders({ Accept: 'application/json, text/plain, */*' });
    return this.http
      .post(`${this.baseUrl}/admin/courses`, body, { headers, observe: 'response', responseType: 'text' })
      .pipe(
        map((resp) => {
          const text = resp.body ?? '';
          let bodyObj: any = text;
          try { bodyObj = JSON.parse(text); } catch {}
          const d = bodyObj?.data ?? {};
          return {
            courseId: d?.id ?? 0,
            courseName: d?.courseName ?? body.courseName ?? '',
            courseImage: d?.courseImage ?? body.courseImage ?? '',
            description: d?.description ?? body.description ?? '',
            price: d?.price ?? body.price ?? 0,
            isFree: d?.isFree ?? !!body.isFree,
            createdAt: d?.createdAt ?? new Date().toISOString(),
            updatedAt: d?.updatedAt ?? new Date().toISOString()
          } as Course;
        })
      );
  }

  updateCourse(courseId: number, body: Partial<Course>): Observable<Course> {
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
    const form = new FormData();
    form.append('courseName', params.courseName);
    if (params.description) form.append('description', params.description);
    form.append('price', String(params.price));
    form.append('isFree', String(params.isFree));
    form.append('courseImage', imageFile);
    // Note: Not setting any headers as browser should set Content-Type automatically for FormData
    return this.http
      .post(`${this.baseUrl}/admin/courses/upload`, form, { observe: 'response', responseType: 'text' })
      .pipe(
        map((resp) => {
          const text = resp.body ?? '';
          let bodyObj: any = text;
          try { bodyObj = JSON.parse(text); } catch {}
          const d = bodyObj?.data ?? {};
          return {
            courseId: d?.id ?? 0,
            courseName: d?.courseName ?? params.courseName,
            courseImage: d?.courseImage ?? '',
            description: d?.description ?? params.description ?? '',
            price: d?.price ?? params.price,
            isFree: d?.isFree ?? params.isFree,
            createdAt: d?.createdAt ?? new Date().toISOString(),
            updatedAt: d?.updatedAt ?? new Date().toISOString()
          } as Course;
        })
      );
  }

  updateCourseUpload(id: number, params: { courseName: string; description?: string; price: number; isFree: boolean }, imageFile: File): Observable<Course> {
    const form = new FormData();
    form.append('courseName', params.courseName);
    if (params.description) form.append('description', params.description);
    form.append('price', String(params.price));
    form.append('isFree', String(params.isFree));
    form.append('courseImage', imageFile);
    // Note: Not setting any headers as browser should set Content-Type automatically for FormData
    return this.http
      .put(`${this.baseUrl}/admin/courses/${id}/upload`, form, { observe: 'response', responseType: 'text' })
      .pipe(
        map((resp) => {
          const text = resp.body ?? '';
          let bodyObj: any = text;
          try { bodyObj = JSON.parse(text); } catch {}
          const d = bodyObj?.data ?? {};
          return {
            courseId: d?.id ?? id,
            courseName: d?.courseName ?? params.courseName,
            courseImage: d?.courseImage ?? '',
            description: d?.description ?? params.description ?? '',
            price: d?.price ?? params.price,
            isFree: d?.isFree ?? params.isFree,
            createdAt: d?.createdAt ?? new Date().toISOString(),
            updatedAt: d?.updatedAt ?? new Date().toISOString()
          } as Course;
        })
      );
  }

  deleteCourse(id: number): Observable<string> {
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
    const headers = new HttpHeaders({ Accept: 'application/json' });
    const payload: any = { isActive: false };
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/courses/${courseId}`, payload, { headers })
      .pipe(map(() => void 0));
  }

  getCourses(): Observable<Course[]> {
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
    const payload = {
      courseId,
      videoTitle: body.videoTitle ?? '',
      videoUrl: body.videoUrl ?? '',
      duration: body.duration ?? 0,
      orderIndex: body.orderIndex ?? 1
    };
    const headers = new HttpHeaders({ Accept: 'application/json, text/plain, */*' });
    return this.http
      .post(`${this.baseUrl}/admin/videos`, payload, { headers, observe: 'response', responseType: 'text' })
      .pipe(
        map((resp) => {
          const text = resp.body ?? '';
          let bodyObj: any = text;
          try { bodyObj = JSON.parse(text); } catch {}
          const d = bodyObj?.data ?? {};
          return {
            videoId: d?.id ?? 0,
            courseId: d?.courseId ?? courseId,
            videoTitle: d?.videoTitle ?? payload.videoTitle,
            videoUrl: d?.videoUrl ?? payload.videoUrl,
            duration: d?.duration ?? payload.duration,
            orderIndex: d?.orderIndex ?? payload.orderIndex
          } as CourseVideo;
        })
      );
  }

  uploadVideo(params: { courseId: number; videoTitle: string; duration: number; orderIndex: number }, file: File): Observable<CourseVideo> {
    const form = new FormData();
    form.append('courseId', String(params.courseId));
    form.append('videoTitle', params.videoTitle);
    form.append('duration', String(params.duration));
    form.append('orderIndex', String(params.orderIndex));
    form.append('videoFile', file);
    // Note: Not setting any headers as browser should set Content-Type automatically for FormData
    return this.http
      .post(`${this.baseUrl}/admin/videos/upload`, form, { observe: 'response', responseType: 'text' })
      .pipe(
        map((resp) => {
          const text = resp.body ?? '';
          let bodyObj: any = text;
          try { bodyObj = JSON.parse(text); } catch {}
          const d = bodyObj?.data ?? {};
          return {
            videoId: d?.id ?? 0,
            courseId: d?.courseId ?? params.courseId,
            videoTitle: d?.videoTitle ?? params.videoTitle,
            videoUrl: d?.videoUrl ?? '',
            duration: d?.duration ?? params.duration,
            orderIndex: d?.orderIndex ?? params.orderIndex
          } as CourseVideo;
        }),
        catchError((error) => {
          // Handle timeout errors specifically for video uploads
          if (error.name === 'TimeoutError' || (error.status === 0 && error.statusText === 'Unknown Error')) {
            throw new Error('انتهت مهلة رفع الفيديو. قد يكون الفيديو كبيرًا جدًا أو يوجد مشكلة في الشبكة. يرجى المحاولة مرة أخرى.');
          }
          throw error;
        })
      );
  }

  getVideosByCourse(courseId: number): Observable<CourseVideo[]> {
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
    return this.http
      .delete<{ success: boolean; message: string; data: string; errors: string[] }>(`${this.baseUrl}/admin/videos/${id}`)
      .pipe(map(res => res?.data ?? ''));
  }

  addQuiz(body: { courseId: number; quizTitle: string; description: string; totalQuestions: number; passingScore: number; timeLimit: number; isActive: boolean; questions?: { questionText: string; questionType: number; orderIndex: number; answers: { answerText: string; isCorrect: boolean; orderIndex: number }[] }[] }): Observable<Quiz> {
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
    return this.http
      .post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes/${quizId}/questions`, body)
      .pipe(map(res => res?.data));
  }

  getQuestions(quizId: number): Observable<any[]> {
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/admin/quizzes/${quizId}/questions`)
      .pipe(map(res => res?.data ?? []));
  }

  updateQuestion(questionId: number, body: { questionText: string; questionType: number; orderIndex: number; answers: { answerText: string; isCorrect: boolean; orderIndex: number }[] }): Observable<any> {
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes/questions/${questionId}`, body)
      .pipe(map(res => res?.data));
  }

  deleteQuestion(questionId: number): Observable<string> {
    return this.http
      .delete<{ success: boolean; message: string; data: string; errors: string[] }>(`${this.baseUrl}/admin/quizzes/questions/${questionId}`)
      .pipe(map(res => res?.data ?? ''));
  }

  getQuizzesByCourse(courseId: number): Observable<Quiz[]> {
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
    return this.http
      .get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/quizzes/${id}`)
      .pipe(map(res => res?.data));
  }

  updateQuiz(id: number, body: { courseId: number; quizTitle: string; description: string; totalQuestions: number; passingScore: number; timeLimit: number; isActive: boolean; questions: { questionText: string; questionType: number; orderIndex: number; answers: { answerText: string; isCorrect: boolean; orderIndex: number }[] }[] }): Observable<Quiz> {
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
    return this.http.post<void>(`${this.baseUrl}/admin/users/${userId}/courses/${courseId}`, {});
  }

  getUsers(): Observable<User[]> {
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

  // Contact Form Methods
  getContactForms(): Observable<ContactForm[]> {
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/admin/contact`)
      .pipe(
        map(res => (res?.data ?? []).map(item => ({
          id: item.id ?? 0,
          name: item.name ?? '',
          email: item.email ?? '',
          number: item.number ?? '',
          text: item.text ?? '',
          createdAt: item.createdAt ?? new Date().toISOString()
        } as ContactForm))),
        catchError((err: any) => {
          console.error('getContactForms error', err);
          return of([]);
        })
      );
  }

  getContactForm(id: number): Observable<ContactForm> {
    return this.http
      .get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/admin/contact/${id}`)
      .pipe(
        map(res => ({
          id: res?.data?.id ?? 0,
          name: res?.data?.name ?? '',
          email: res?.data?.email ?? '',
          number: res?.data?.number ?? '',
          text: res?.data?.text ?? '',
          createdAt: res?.data?.createdAt ?? new Date().toISOString()
        } as ContactForm)),
        catchError((err: any) => {
          console.error('getContactForm error', err);
          throw err;
        })
      );
  }

  deleteContactForm(id: number): Observable<string> {
    return this.http
      .delete<{ success: boolean; message: string; data: string; errors: string[] }>(`${this.baseUrl}/admin/contact/${id}`)
      .pipe(
        map(res => res?.data ?? 'deleted'),
        catchError((err: any) => {
          console.error('deleteContactForm error', err);
          throw err;
        })
      );
  }

  submitContactForm(form: ContactFormCreate): Observable<ContactForm> {
    return this.http
      .post<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Contact`, form)
      .pipe(
        map(res => ({
          id: res?.data?.id ?? 0,
          name: res?.data?.name ?? form.name,
          email: res?.data?.email ?? form.email,
          number: res?.data?.number ?? form.number,
          text: res?.data?.text ?? form.text,
          createdAt: res?.data?.createdAt ?? new Date().toISOString()
        } as ContactForm)),
        catchError((err: any) => {
          console.error('submitContactForm error', err);
          throw err;
        })
      );
  }
}
