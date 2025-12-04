import { Component, OnInit, OnDestroy, Renderer2 } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router, NavigationStart, NavigationEnd, NavigationCancel, NavigationError } from '@angular/router';
import { NgIf } from '@angular/common';
import { FooterComponent } from './components/footer/footer.component';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'courses-site';
  isLoading = false;
  private routerSubscription?: Subscription;

  constructor(private router: Router, private renderer: Renderer2) {}

  ngOnInit() {
    // Add performance monitoring
    if ('performance' in window) {
      window.addEventListener('load', () => {
        setTimeout(() => {
          const perfData = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
          if (perfData) {
            console.log('Page Load Time:', perfData.loadEventEnd - perfData.fetchStart, 'ms');
            console.log('DOM Content Loaded:', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
          }
        }, 0);
      });
    }

    // Listen to router events to show/hide loading indicator
    // الاستماع إلى أحداث الموجه لإظهار/إخفاء مؤشر التحميل
    this.routerSubscription = this.router.events.pipe(
      filter(event => 
        event instanceof NavigationStart || 
        event instanceof NavigationEnd || 
        event instanceof NavigationCancel || 
        event instanceof NavigationError
      )
    ).subscribe(event => {
      if (event instanceof NavigationStart) {
        this.isLoading = true;
        // Add loading performance marker
        if ('performance' in window) {
          performance.mark('navigation-start');
        }
      } else if (
        event instanceof NavigationEnd || 
        event instanceof NavigationCancel || 
        event instanceof NavigationError
      ) {
        // Add small delay for better UX
        setTimeout(() => {
          this.isLoading = false;
          // Add navigation performance marker
          if ('performance' in window) {
            performance.mark('navigation-end');
            performance.measure('navigation-duration', 'navigation-start', 'navigation-end');
            const measures = performance.getEntriesByName('navigation-duration');
            if (measures.length > 0) {
              console.log('Navigation Duration:', measures[0].duration, 'ms');
            }
          }
        }, 300);
      }
    });
  }

  ngOnDestroy() {
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  isLoggedIn() { try { return !!localStorage.getItem('token'); } catch { return false; } }
  isAdmin() { try { return (localStorage.getItem('role') || '').toLowerCase() === 'admin'; } catch { return false; } }
  logout() { try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('role'); } catch {} this.router.navigateByUrl('/'); }
}
