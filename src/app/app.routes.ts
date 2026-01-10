import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';
import { AboutComponent } from './pages/about/about.component';
import { authGuard } from './core/auth.guard';
import { adminGuard } from './core/admin.guard';
import { NotFoundComponent } from './pages/not-found/not-found.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', component: HomeComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'about', component: AboutComponent },
  { path: 'contact', loadComponent: () => import('./pages/contact/contact.component').then(m => m.ContactComponent) },
  { path: 'join-us', loadComponent: () => import('./pages/join-us/join-us.component').then(m => m.JoinUsComponent) },
  { path: 'consulting-services', loadComponent: () => import('./pages/consulting-services/consulting-services.component').then(m => m.ConsultingServicesComponent) },
  { path: 'training-services', loadComponent: () => import('./pages/training-services/training-services.component').then(m => m.TrainingServicesComponent) },

  { path: 'training-guide', loadComponent: () => import('./pages/training-guide/training-guide.component').then(m => m.TrainingGuideComponent) },
  { path: 'courses', loadComponent: () => import('./pages/courses-list/courses-list.component').then(m => m.CoursesListComponent), canActivate: [authGuard] },
  { path: 'courses/:id', loadComponent: () => import('./pages/course-detail/course-detail.component').then(m => m.CourseDetailComponent), canActivate: [authGuard] },
  { path: 'videos/:id', loadComponent: () => import('./pages/video-player/video-player.component').then(m => m.VideoPlayerComponent), canActivate: [authGuard] },
  { path: 'quizzes/:id', loadComponent: () => import('./pages/quiz/quiz.component').then(m => m.QuizComponent), canActivate: [authGuard] },
  { path: 'admin', redirectTo: 'admin/courses', pathMatch: 'full' },
  { path: 'admin/courses', loadComponent: () => import('./pages/admin-courses/admin-courses.component').then(m => m.AdminCoursesComponent), canActivate: [adminGuard] },
  { path: 'admin/videos', loadComponent: () => import('./pages/admin-videos/admin-videos.component').then(m => m.AdminVideosComponent), canActivate: [adminGuard] },
  { path: 'admin/quizzes', loadComponent: () => import('./pages/admin-quizzes/admin-quizzes.component').then(m => m.AdminQuizzesComponent), canActivate: [adminGuard] },
  { path: 'admin/assign', loadComponent: () => import('./pages/admin-assign/admin-assign.component').then(m => m.AdminAssignComponent), canActivate: [adminGuard] },
  { path: 'admin/contact', loadComponent: () => import('./pages/admin-contact/admin-contact.component').then(m => m.AdminContactComponent), canActivate: [adminGuard] },
  { path: '**', component: NotFoundComponent }
];
