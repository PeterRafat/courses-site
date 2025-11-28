import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NgForOf, NgIf } from '@angular/common';
import { trigger, transition, style, animate, stagger, query } from '@angular/animations';
import { CoursesService } from '../../services/courses.service';
import { UserCoursesService } from '../../services/user-courses.service';
import { Course } from '../../models/entities';

@Component({
  selector: 'app-courses-list',
  standalone: true,
  imports: [RouterLink, NgForOf, NgIf],
  templateUrl: './courses-list.component.html',
  styleUrls: ['./courses-list.component.css'],
  animations: [
    trigger('fadeInUp', [
      transition(':enter', [
        query(':enter', [
          style({ opacity: 0, transform: 'translateY(20px)' }),
          stagger(100, [
            animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' }))
          ])
        ], { optional: true })
      ])
    ])
  ]
})
export class CoursesListComponent {
  courses: Course[] = [];
  accessible: Set<number> = new Set<number>();
  constructor(private coursesService: CoursesService, private userCourses: UserCoursesService) {
    this.coursesService.getCourses().subscribe(res => this.courses = res);
    this.userCourses.getMyCourses().subscribe(list => {
      for (const uc of list) if (uc.isActive) this.accessible.add(uc.courseId);
    });
  }

  onImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }
}