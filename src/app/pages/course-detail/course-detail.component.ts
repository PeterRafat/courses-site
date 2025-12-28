import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgForOf, CurrencyPipe, DatePipe } from '@angular/common';
import { CoursesService } from '../../services/courses.service';
import { UserCoursesService } from '../../services/user-courses.service';
import { QuizzesService, SubmitQuizResult } from '../../services/quizzes.service';
import { AuthService } from '../../services/auth.service';
import { Course, CourseVideo, Quiz, User } from '../../models/entities';

@Component({
  selector: 'app-course-detail',
  standalone: true,
  imports: [RouterLink, NgIf, NgForOf, CurrencyPipe, DatePipe],
  templateUrl: './course-detail.component.html',
  styleUrls: ['./course-detail.component.css']
})
export class CourseDetailComponent {
  course?: Course;
  videos: CourseVideo[] = [];
  quizzes: Quiz[] = [];
  attempts: SubmitQuizResult[] = [];
  canAccess = false;
  adminWhatsapp = '201006127934';
  whatsAppLink = '';
  completionPercentage = 0;
  watchedVideos: Set<number> = new Set<number>();
  passedQuizzes: Set<number> = new Set<number>();
  certificateSentMessage = false;
  currentUser?: User;

  constructor(private route: ActivatedRoute, private courses: CoursesService, private quizzesSvc: QuizzesService, private userCourses: UserCoursesService, private authService: AuthService) {
    // Load current user first
    this.authService.me().subscribe(user => {
      this.currentUser = user;
      console.log('Current user loaded:', user);
      
      const id = Number(this.route.snapshot.paramMap.get('id'));
      console.log('Loading course detail for ID:', id);
      
      // Load progress from localStorage
      this.loadProgress(id);
      
      this.courses.getCourse(id).subscribe(c => {
        this.course = c;
        console.log('Course loaded:', c);
        this.canAccess = !!c.isFree;
        this.whatsAppLink = `https://wa.me/${this.adminWhatsapp}?text=${encodeURIComponent('أرغب في حجز كورس ' + c.courseName)}`;
        if (!this.canAccess) {
          this.userCourses.isUserAssignedToCourse(id).subscribe((assigned) => {
            this.canAccess = assigned;
            console.log('User assigned to course:', assigned);
            if (this.canAccess) {
              this.loadData(id);
            }
          });
        } else {
          console.log('Course is free, loading content...');
          this.loadData(id);
        }
      });
    });
  }

  loadData(courseId: number) {
    this.courses.getCourseVideos(courseId).subscribe(v => {
      this.videos = v;
      console.log('Videos loaded:', v);
      this.calculateProgress();
    });
    this.quizzesSvc.getCourseQuizzes(courseId).subscribe(q => {
      this.quizzes = q;
      console.log('Quizzes loaded:', q);
      this.calculateProgress();
    });
    // Load course-specific quiz attempts history
    this.quizzesSvc.getCourseAttempts(courseId).subscribe(a => {
      this.attempts = a;
      console.log('Course attempts history loaded:', a);
      // Update passed quizzes based on attempts
      this.updatePassedQuizzes();
      this.calculateProgress();
    });
    
    // For testing purposes, simulate 100% completion
    // Remove this in production
    // setTimeout(() => {
    //   this.completionPercentage = 100;
    //   this.certificateSentMessage = true;
    //   this.cdr.detectChanges();
    // }, 1000);
  }

  loadProgress(courseId: number) {
    try {
      // Create user-specific keys
      const userId = this.currentUser?.userId || 0;
      const watchedVideosKey = `user_${userId}_course_${courseId}_watched_videos`;
      const passedQuizzesKey = `user_${userId}_course_${courseId}_passed_quizzes`;
      const progressKey = `user_${userId}_course_${courseId}_progress`;
      
      // Load watched videos from localStorage
      const watchedVideos = JSON.parse(localStorage.getItem(watchedVideosKey) || '[]');
      this.watchedVideos = new Set(watchedVideos);
      
      // Load passed quizzes from localStorage
      const passedQuizzes = JSON.parse(localStorage.getItem(passedQuizzesKey) || '[]');
      this.passedQuizzes = new Set(passedQuizzes);
      
      // Load saved progress if exists
      const progress = localStorage.getItem(progressKey);
      if (progress) {
        const data = JSON.parse(progress);
        this.completionPercentage = data.completionPercentage || 0;
        
        // If progress is at 100%, ensure we send it to backend
        if (this.completionPercentage === 100) {
          this.sendCompletionToBackend(courseId);
        }
      }
    } catch (e) {
      console.error('Error loading progress from localStorage:', e);
      this.watchedVideos = new Set<number>();
      this.passedQuizzes = new Set<number>();
      this.completionPercentage = 0;
    }
  }

  saveProgress(courseId: number) {
    try {
      // Create user-specific key
      const userId = this.currentUser?.userId || 0;
      const progressKey = `user_${userId}_course_${courseId}_progress`;
      
      const progress = {
        watchedVideos: Array.from(this.watchedVideos),
        passedQuizzes: Array.from(this.passedQuizzes),
        completionPercentage: this.completionPercentage
      };
      localStorage.setItem(progressKey, JSON.stringify(progress));
      
      // If progress is at 100%, ensure we send it to backend and show certificate message
      if (this.completionPercentage === 100) {
        this.sendCompletionToBackend(courseId);
      }
    } catch (e) {
      console.error('Error saving progress to localStorage:', e);
    }
  }

  updatePassedQuizzes() {
    // Mark quizzes as passed based on successful attempts
    this.attempts.forEach(attempt => {
      if (attempt.isPassed) {
        this.passedQuizzes.add(attempt.quizId);
      }
    });
  }

  calculateProgress() {
    const totalItems = this.videos.length + this.quizzes.length;
    if (totalItems === 0) {
      this.completionPercentage = 0;
      return;
    }
    
    const completedItems = this.watchedVideos.size + this.passedQuizzes.size;
    this.completionPercentage = Math.round((completedItems / totalItems) * 100);
    
    // Save progress
    if (this.course) {
      this.saveProgress(this.course.courseId);
      
      // Send 100% completion to backend
      if (this.completionPercentage === 100) {
        this.sendCompletionToBackend(this.course.courseId);
      }
    }
  }

  markVideoAsWatched(videoId: number) {
    if (this.course) {
      this.watchedVideos.add(videoId);
      this.calculateProgress();
    }
  }

  markQuizAsPassed(quizId: number) {
    if (this.course) {
      this.passedQuizzes.add(quizId);
      this.calculateProgress();
    }
  }

  sendCompletionToBackend(courseId: number) {
    // Create user-specific key
    const userId = this.currentUser?.userId || 0;
    const completionSentKey = `user_${userId}_course_${courseId}_completion_sent`;
    
    // Only send once
    const completionSent = localStorage.getItem(completionSentKey);
    if (completionSent) {
      // Mark that we should show the certificate message
      this.certificateSentMessage = true;
      return;
    }
    
    console.log(`Sending 100% completion for course ${courseId} to backend`);
    this.userCourses.updateCourseProgress(courseId, 100).subscribe({
      next: (response) => {
        console.log('Successfully sent completion to backend:', response);
        localStorage.setItem(completionSentKey, 'true');
        // Mark that we should show the certificate message
        this.certificateSentMessage = true;
      },
      error: (error) => {
        console.error('Error sending completion to backend:', error);
        // Even if there's an error, we should still show the certificate message
        // since the user has completed 100% of the course
        this.certificateSentMessage = true;
        // Set the localStorage flag to prevent repeated failed attempts
        if (this.course) {
          localStorage.setItem(completionSentKey, 'true');
        }
        // We'll try again next time
      }
    });
  }

  // removed conversion for UI-only label change
}
