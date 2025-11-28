import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { NgIf } from '@angular/common';
import { FooterComponent } from './components/footer/footer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, NgIf, FooterComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'courses-site';
  constructor(private router: Router) {}
  isLoggedIn() { try { return !!localStorage.getItem('token'); } catch { return false; } }
  isAdmin() { try { return (localStorage.getItem('role') || '').toLowerCase() === 'admin'; } catch { return false; } }
  logout() { try { localStorage.removeItem('token'); localStorage.removeItem('refreshToken'); localStorage.removeItem('role'); } catch {} this.router.navigateByUrl('/'); }
}
