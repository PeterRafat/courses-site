import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { Course, CourseVideo, Quiz } from '../models/entities';
import { formatCourseImageUrl, formatVideoUrl } from '../utils/image-url.util';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from '../core/error-handler.service';

@Injectable({ providedIn: 'root' })
export class CoursesService {
  private baseUrl = environment.apiBaseUrl;
  private coursesCache$?: Observable<Course[]>;
  private coursesCacheTime?: number;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {}

  getCourses(): Observable<Course[]> {
    // Check if we have a valid cache
    const now = Date.now();
    if (this.coursesCache$ && this.coursesCacheTime && (now - this.coursesCacheTime < this.CACHE_DURATION)) {
      console.log('Returning cached courses');
      return this.coursesCache$;
    }
    
    console.log('Fetching fresh courses from API');
    
    // Create new request with caching
    this.coursesCache$ = this.http.get<{ success: boolean; message: string; data: any[]; errors: string[] }>(`${this.baseUrl}/Courses`).pipe(
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
      shareReplay(1, this.CACHE_DURATION), // Cache for 5 minutes
      catchError(err => { this.errorHandler.showError(err, 'فشل تحميل الكورسات'); return of([]); })
    );
    
    this.coursesCacheTime = now;
    return this.coursesCache$;
  }

  // Cache for individual courses
  private courseCache = new Map<number, Observable<Course>>();
  private courseCacheTime = new Map<number, number>();
  private readonly COURSE_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  getCourse(courseId: number): Observable<Course> {
    // Check if we have a valid cache for this course
    const now = Date.now();
    const cachedCourse = this.courseCache.get(courseId);
    const cacheTime = this.courseCacheTime.get(courseId);
    
    if (cachedCourse && cacheTime && (now - cacheTime < this.COURSE_CACHE_DURATION)) {
      console.log(`Returning cached course ${courseId}`);
      return cachedCourse;
    }
    
    console.log(`Fetching fresh course ${courseId} from API`);
    
    // Create new request with caching
    const course$ = this.http.get<{ success: boolean; message: string; data: any; errors: string[] }>(`${this.baseUrl}/Courses/${courseId}`).pipe(
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
      shareReplay(1, this.COURSE_CACHE_DURATION), // Cache for 5 minutes
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
    
    // Store in cache
    this.courseCache.set(courseId, course$);
    this.courseCacheTime.set(courseId, now);
    
    return course$;
  }

  // Cache for course videos
  private courseVideosCache = new Map<number, Observable<CourseVideo[]>>();
  private courseVideosCacheTime = new Map<number, number>();
  private readonly VIDEOS_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  getCourseVideos(courseId: number): Observable<CourseVideo[]> {
    // Check if we have a valid cache for this course's videos
    const now = Date.now();
    const cachedVideos = this.courseVideosCache.get(courseId);
    const cacheTime = this.courseVideosCacheTime.get(courseId);
    
    if (cachedVideos && cacheTime && (now - cacheTime < this.VIDEOS_CACHE_DURATION)) {
      console.log(`Returning cached videos for course ${courseId}`);
      return cachedVideos;
    }
    
    console.log(`Fetching fresh videos for course ${courseId} from API`);
    
    // Create new request with caching
    const videos$ = this.http
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
        shareReplay(1, this.VIDEOS_CACHE_DURATION), // Cache for 5 minutes
        catchError(err => { this.errorHandler.showError(err, 'فشل تحميل فيديوهات الكورس'); return of([]); })
      );
    
    // Store in cache
    this.courseVideosCache.set(courseId, videos$);
    this.courseVideosCacheTime.set(courseId, now);
    
    return videos$;
  }

  // Cache for course quizzes
  private courseQuizzesCache = new Map<number, Observable<Quiz[]>>();
  private courseQuizzesCacheTime = new Map<number, number>();
  private readonly QUIZZES_CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  getCourseQuizzes(courseId: number): Observable<Quiz[]> {
    // Check if we have a valid cache for this course's quizzes
    const now = Date.now();
    const cachedQuizzes = this.courseQuizzesCache.get(courseId);
    const cacheTime = this.courseQuizzesCacheTime.get(courseId);
    
    if (cachedQuizzes && cacheTime && (now - cacheTime < this.QUIZZES_CACHE_DURATION)) {
      console.log(`Returning cached quizzes for course ${courseId}`);
      return cachedQuizzes;
    }
    
    console.log(`Fetching fresh quizzes for course ${courseId} from API`);
    
    // Note: Backend should provide /api/Quizzes/courses/{courseId} endpoint
    // For now, using admin endpoint - may fail with 403 for non-admin users
    const quizzes$ = this.http
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
        shareReplay(1, this.QUIZZES_CACHE_DURATION), // Cache for 5 minutes
        catchError((err) => { this.errorHandler.showError(err, 'فشل تحميل كويزات الكورس'); return of([]); })
      );
    
    // Store in cache
    this.courseQuizzesCache.set(courseId, quizzes$);
    this.courseQuizzesCacheTime.set(courseId, now);
    
    return quizzes$;
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
          // Removed error alert - user doesn't want alerts
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
          // Removed error alert - user doesn't want alerts
          return of({ 
            signedUrl: '', 
            expiresAt: new Date().toISOString(), 
            videoId, 
            videoTitle: '' 
          }); 
        })
      );
  }

  // Method to clear all caches
  clearCache(): void {
    this.coursesCache$ = undefined;
    this.coursesCacheTime = undefined;
    this.courseCache.clear();
    this.courseCacheTime.clear();
    this.courseVideosCache.clear();
    this.courseVideosCacheTime.clear();
    this.courseQuizzesCache.clear();
    this.courseQuizzesCacheTime.clear();
  }
}
