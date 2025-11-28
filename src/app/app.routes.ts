import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AboutComponent } from './pages/about/about.component';
import { CoursesListComponent } from './pages/courses-list/courses-list.component';
import { CourseDetailComponent } from './pages/course-detail/course-detail.component';
import { AdminDashboardComponent } from './pages/admin-dashboard/admin-dashboard.component';
import { AdminCoursesComponent } from './pages/admin-courses/admin-courses.component';
import { AdminVideosComponent } from './pages/admin-videos/admin-videos.component';
import { AdminQuizzesComponent } from './pages/admin-quizzes/admin-quizzes.component';
import { AdminAssignComponent } from './pages/admin-assign/admin-assign.component';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';
import { QuizComponent } from './pages/quiz/quiz.component';
import { NotFoundComponent } from './pages/not-found/not-found.component';
import { VideoPlayerComponent } from './pages/video-player/video-player.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'about', component: AboutComponent },
  { path: 'courses', component: CoursesListComponent, canActivate: [authGuard] },
  { path: 'courses/:id', component: CourseDetailComponent, canActivate: [authGuard] },
  { path: 'videos/:id', component: VideoPlayerComponent, canActivate: [authGuard] },
  { path: 'quizzes/:id', component: QuizComponent, canActivate: [authGuard] },
  { path: 'admin', redirectTo: 'admin/courses', pathMatch: 'full' },
  { path: 'admin/courses', component: AdminCoursesComponent, canActivate: [adminGuard] },
  { path: 'admin/videos', component: AdminVideosComponent, canActivate: [adminGuard] },
  { path: 'admin/quizzes', component: AdminQuizzesComponent, canActivate: [adminGuard] },
  { path: 'admin/assign', component: AdminAssignComponent, canActivate: [adminGuard] },
  { path: '**', component: NotFoundComponent }
];
