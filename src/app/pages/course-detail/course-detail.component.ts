import { Component } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { NgIf, NgForOf, CurrencyPipe, DatePipe } from '@angular/common';
import { CoursesService } from '../../services/courses.service';
import { UserCoursesService } from '../../services/user-courses.service';
import { QuizzesService, SubmitQuizResult } from '../../services/quizzes.service';
import { Course, CourseVideo, Quiz } from '../../models/entities';

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

  constructor(private route: ActivatedRoute, private courses: CoursesService, private quizzesSvc: QuizzesService, private userCourses: UserCoursesService) {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    console.log('Loading course detail for ID:', id);
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
            this.courses.getCourseVideos(id).subscribe(v => {
              this.videos = v;
              console.log('Videos loaded:', v);
            });
            this.quizzesSvc.getCourseQuizzes(id).subscribe(q => {
              this.quizzes = q;
              console.log('Quizzes loaded:', q);
            });
            this.quizzesSvc.getCourseAttempts(id).subscribe(a => {
              this.attempts = a;
              console.log('Attempts loaded:', a);
            });
          }
        });
      } else {
        console.log('Course is free, loading content...');
        this.courses.getCourseVideos(id).subscribe(v => {
          this.videos = v;
          console.log('Videos loaded:', v);
        });
        this.quizzesSvc.getCourseQuizzes(id).subscribe(q => {
          this.quizzes = q;
          console.log('Quizzes loaded:', q);
        });
        this.quizzesSvc.getCourseAttempts(id).subscribe(a => {
          this.attempts = a;
          console.log('Attempts loaded:', a);
        });
      }
    });
  }

  // removed conversion for UI-only label change
}
