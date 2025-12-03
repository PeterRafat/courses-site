import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { UserCourse, Course } from '../models/entities';
import { environment } from '../../environments/environment';
import { formatCourseImageUrl } from '../utils/image-url.util';
import { ErrorHandlerService } from '../core/error-handler.service';

export interface UserCourseWithDetails extends UserCourse {
  course?: Course & {
    videoCount?: number;
    quizCount?: number;
  };
}

export interface CourseProgress {
  completionPercentage: number;
}

@Injectable({ providedIn: 'root' })
export class UserCoursesService {
  private baseUrl = environment.apiBaseUrl;

  constructor(private http: HttpClient, private errorHandler: ErrorHandlerService) {}

  /**
   * Get all courses assigned to the current user
   */
  getMyCourses(): Observable<UserCourseWithDetails[]> {
    console.log('Fetching user courses from:', `${this.baseUrl}/user-courses/my-courses`);
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http
      .get<{ success: boolean; message: string; data: any[]; errors: string[] }>(
        `${this.baseUrl}/user-courses/my-courses`,
        { headers }
      )
      .pipe(
        map((res) =>
          (res?.data ?? []).map((item) => ({
            userCourseId: item.id ?? 0,
            userId: item.userId ?? 0,
            courseId: item.courseId ?? 0,
            addedAt: item.addedAt ?? new Date().toISOString(),
            isActive: item.isActive ?? true,
            completionPercentage: item.completionPercentage ?? 0,
            completedAt: item.completedAt,
            course: item.course
              ? {
                  courseId: item.course.id ?? 0,
                  courseName: item.course.courseName ?? '',
                  courseImage: formatCourseImageUrl(item.course.courseImage),
                  description: item.course.description ?? '',
                  price: item.course.price ?? 0,
                  isFree: item.course.isFree ?? false,
                  createdAt: item.course.createdAt ?? new Date().toISOString(),
                  updatedAt: item.course.updatedAt ?? new Date().toISOString(),
                  videoCount: item.course.videoCount ?? 0,
                  quizCount: item.course.quizCount ?? 0
                }
              : undefined
          } as UserCourseWithDetails))
        ),
        catchError((err) => { this.errorHandler.showError(err, 'فشل تحميل كورساتي'); return of([]); })
      );
  }

  /**
   * Get progress for a specific course
   */
  getCourseProgress(courseId: number): Observable<UserCourseWithDetails | null> {
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http
      .get<{ success: boolean; message: string; data: any; errors: string[] }>(
        `${this.baseUrl}/user-courses/courses/${courseId}/progress`,
        { headers }
      )
      .pipe(
        map((res) => {
          if (!res?.data) return null;
          const item = res.data;
          return {
            userCourseId: item.id ?? 0,
            userId: item.userId ?? 0,
            courseId: item.courseId ?? 0,
            addedAt: item.addedAt ?? new Date().toISOString(),
            isActive: item.isActive ?? true,
            completionPercentage: item.completionPercentage ?? 0,
            completedAt: item.completedAt,
            course: item.course
              ? {
                  courseId: item.course.id ?? 0,
                  courseName: item.course.courseName ?? '',
                  courseImage: formatCourseImageUrl(item.course.courseImage),
                  description: item.course.description ?? '',
                  price: item.course.price ?? 0,
                  isFree: item.course.isFree ?? false,
                  createdAt: item.course.createdAt ?? new Date().toISOString(),
                  updatedAt: item.course.updatedAt ?? new Date().toISOString(),
                  videoCount: item.course.videoCount ?? 0,
                  quizCount: item.course.quizCount ?? 0
                }
              : undefined
          } as UserCourseWithDetails;
        }),
        catchError((err) => {
          // 404 means user is not assigned to this course
          if (err?.status === 404) {
            return of(null);
          }
          console.error('Error fetching course progress:', err);
          return of(null);
        })
      );
  }

  /**
   * Update course progress
   */
  updateCourseProgress(courseId: number, completionPercentage: number): Observable<UserCourseWithDetails> {
    const headers = new HttpHeaders({ Accept: 'application/json', 'Content-Type': 'application/json' });
    return this.http
      .put<{ success: boolean; message: string; data: any; errors: string[] }>(
        `${this.baseUrl}/user-courses/courses/${courseId}/progress`,
        { completionPercentage },
        { headers }
      )
      .pipe(
        map((res) => {
          const item = res?.data;
          if (!item) {
            throw new Error('No data received');
          }
          return {
            userCourseId: item.id ?? 0,
            userId: item.userId ?? 0,
            courseId: item.courseId ?? 0,
            addedAt: item.addedAt ?? new Date().toISOString(),
            isActive: item.isActive ?? true,
            completionPercentage: item.completionPercentage ?? 0,
            completedAt: item.completedAt,
            course: item.course
              ? {
                  courseId: item.course.id ?? 0,
                  courseName: item.course.courseName ?? '',
                  courseImage: formatCourseImageUrl(item.course.courseImage),
                  description: item.course.description ?? '',
                  price: item.course.price ?? 0,
                  isFree: item.course.isFree ?? false,
                  createdAt: item.course.createdAt ?? new Date().toISOString(),
                  updatedAt: item.course.updatedAt ?? new Date().toISOString(),
                  videoCount: item.course.videoCount ?? 0,
                  quizCount: item.course.quizCount ?? 0
                }
              : undefined
          } as UserCourseWithDetails;
        }),
        catchError((err) => {
          console.error('Error updating course progress:', err);
          return throwError(() => err);
        })
      );
  }

  /**
   * Check if user is assigned to a course
   */
  isUserAssignedToCourse(courseId: number): Observable<boolean> {
    return this.getCourseProgress(courseId).pipe(
      map((progress) => progress !== null && progress.isActive)
    );
  }
}

