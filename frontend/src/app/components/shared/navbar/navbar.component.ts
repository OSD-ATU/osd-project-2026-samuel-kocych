import { Component, computed, inject, signal } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Router, RouterModule } from '@angular/router';
import { AuthCustomService } from '../../../services/auth-custom.service';
import { AsyncPipe } from '@angular/common';
import { map, Observable } from 'rxjs';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [
    RouterModule,
    MatToolbarModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    AsyncPipe,
  ],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
})
export class NavbarComponent {
  private authService = inject(AuthCustomService);
  private router = inject(Router);

  isAuthenticated$ = this.authService.isAuthenticated$;

  isEditor$ = this.authService.currentUser$.pipe(
    map((user) => user?.role === 'admin' || user?.role === 'editor')
  );

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
