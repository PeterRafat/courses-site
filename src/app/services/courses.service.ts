import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { Course, CourseVideo, Quiz } from '../models/entities';
import { formatCourseImageUrl, formatVideoUrl } from '../utils/image-url.util';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from '../core/error-handler.service';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {}

  getCourses(): Observable<Course[]> {
    return this.http.get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/Courses`).pipe(
      map(res => (res?.data ?? []).map(item => ({
        courseId: item.id,
        courseName: item.courseName,
        courseImage: formatCourseImageUrl(item.courseImage),
        description: item.description,
        price: item.price,
        isFree: item.isFree,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      } as Course))),
      catchError(err => { this.errorHandler.showError(err, 'فشل تحميل الكورسات'); return of([]); })
    );
  }

  getCourse(courseId: number): Observable<Course> {
    return this.http.get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Courses/${courseId}`).pipe(
      map(res => ({
        courseId: res?.data?.id ?? courseId,
        courseName: res?.data?.courseName ?? 'غير متاح',
        courseImage: formatCourseImageUrl(res?.data?.courseImage ?? ''),
        description: res?.data?.description ?? '',
        price: res?.data?.price ?? 0,
        isFree: res?.data?.isFree ?? false,
        createdAt: res?.data?.createdAt ?? new Date().toISOString(),
        updatedAt: res?.data?.updatedAt ?? new Date().toISOString()
      } as Course)),
      catchError(err => { this.errorHandler.showError(err, 'فشل تحميل الكورس'); return of({
        courseId,
        courseName: 'غير متاح',
        courseImage: '',
        description: '',
        price: 0,
        isFree: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      } as Course); })
    );
  }

  getCourseVideos(courseId: number): Observable<CourseVideo[]> {
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/Courses/${courseId}/videos`)
      .pipe(
        map(res => (res?.data ?? []).map(item => ({
          videoId: item.id ?? 0,
          courseId: item.courseId ?? courseId,
          videoTitle: item.videoTitle ?? '',
          videoUrl: formatVideoUrl(item.videoUrl ?? ''),
          duration: item.duration ?? 0,
          orderIndex: item.orderIndex ?? 1
        } as CourseVideo))),
        catchError(err => { this.errorHandler.showError(err, 'فشل تحميل فيديوهات الكورس'); return of([]); })
      );
  }

  getCourseQuizzes(courseId: number): Observable<Quiz[]> {
    // Note: Backend should provide /api/Quizzes/courses/{courseId} endpoint
    // For now, using admin endpoint - may fail with 403 for non-admin users
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
        ),
        catchError((err) => { this.errorHandler.showError(err, 'فشل تحميل كويزات الكورس'); return of([]); })
      );
  }

  getVideo(videoId: number): Observable<CourseVideo> {
    console.log('Fetching video from API:', `${this.baseUrl}/Videos/${videoId}`);
    return this.http
      .get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Videos/${videoId}`)
      .pipe(
        map(res => {
          console.log('API Response for video:', res);
          const d = res?.data ?? {};
          const id = d.id ?? d.videoId ?? videoId;
          const formattedUrl = formatVideoUrl(d.videoUrl ?? '');
          console.log('Original videoUrl from API:', d.videoUrl);
          console.log('Formatted videoUrl:', formattedUrl);
          return {
            videoId: id,
            courseId: d.courseId ?? 0,
            videoTitle: d.videoTitle ?? '',
            videoUrl: formattedUrl,
            duration: d.duration ?? 0,
            orderIndex: d.orderIndex ?? 0
          } as CourseVideo;
        }),
        catchError(err => { 
          this.errorHandler.showError(err, 'فشل تحميل الفيديو');
          return of({
            videoId, 
            courseId: 0, 
            videoTitle: 'غير متاح', 
            videoUrl: '', 
            duration: 0, 
            orderIndex: 0
          } as CourseVideo); 
        })
      );
  }

  getSignedUrl(videoId: number): Observable<{ signedUrl: string; expiresAt: string; videoId: number; videoTitle: string; duration?: number; courseId?: number }> {
    console.log('Requesting signed URL for video ID:', videoId);
    console.log('Request URL:', `${this.baseUrl}/Videos/${videoId}/signed-url`);
    return this.http
      .get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Videos/${videoId}/signed-url`)
      .pipe(
        map(res => {
          console.log('Signed URL API response:', res);
          console.log('Response data:', res?.data);
          const result = {
            signedUrl: res?.data?.signedUrl ?? '',
            expiresAt: res?.data?.expiresAt ?? new Date().toISOString(),
            videoId: res?.data?.videoId ?? videoId,
            videoTitle: res?.data?.videoTitle ?? '',
            duration: res?.data?.duration,
            courseId: res?.data?.courseId
          };
          console.log('Extracted signed URL data:', result);
          return result;
        }),
        catchError(err => { 
          this.errorHandler.showError(err, 'فشل الحصول على رابط الفيديو');
          return of({ 
            signedUrl: '', 
            expiresAt: new Date().toISOString(), 
            videoId, 
            videoTitle: '' 
          }); 
        })
      );
  }
}
