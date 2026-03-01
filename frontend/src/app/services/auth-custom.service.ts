import { inject, Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { User } from '../interfaces/user.interface';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AuthCustomService {
  readonly currentUser$ = new BehaviorSubject<User | null>(null);
  readonly isAuthenticated$ = new BehaviorSubject<boolean>(false);

  // observable of the user's role
  readonly role$ = this.currentUser$.pipe(map((user) => user?.role ?? null));

  // true if user is editor or admin
  readonly isEditor$ = this.role$.pipe(
    map((role) => role === 'editor' || role === 'admin')
  );

  // true only if user is admin
  readonly isAdmin$ = this.role$.pipe(map((role) => role === 'admin'));

  private http = inject(HttpClient);
  private authenticateTimeout: any;

  constructor() {
    const userJson = localStorage.getItem('user');
    if (userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.currentUser$.next(user);
      } catch (err) {
        console.error('Error parsing stored user', err);
        this.currentUser$.next(null);
      }
    }

    const token = localStorage.getItem('token');

    // if there is a token we need to check if it has expired
    if (token) {
      try {
        const payloadBase64 = token.split('.')[1];
        if (payloadBase64) {
          const payload = JSON.parse(atob(payloadBase64));
          const expires = payload.exp * 1000;
          if (expires > Date.now()) {
            this.isAuthenticated$.next(true);
            this.startAuthenticateTimer(expires);
          } else {
            this.logout();
          }
        }
      } catch (err) {
        console.error('Invalid token in localStorage', err);
        this.logout();
      }
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<{ user: User; token: string }>(
        'http://localhost:3000/api/v1/auth/login',
        {
          email,
          password,
        }
      )
      .pipe(
        tap((response: { user: User; token: string }) => {
          localStorage.setItem('user', JSON.stringify(response.user));
          localStorage.setItem('token', response.token);
          this.currentUser$.next(response.user);
          this.isAuthenticated$.next(true);
          try {
            const payloadBase64 = response.token.split('.')[1];
            if (payloadBase64) {
              const payload = JSON.parse(atob(payloadBase64));
              const expires = payload.exp * 1000;
              this.startAuthenticateTimer(expires);
            }
          } catch {}
        })
      );
  }

  register(name: string, email: string, password: string, role: any) {
    return this.http.post('http://localhost:3000/api/v1/auth/register', {
      name,
      email,
      password,
      role,
    });
  }

  public logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.currentUser$.next(null);
    this.isAuthenticated$.next(false);
  }

  private startAuthenticateTimer(expires: number) {
    // set a timeout to re-authenticate with the api one minute before the token expires

    const timeout = expires - Date.now() - 60 * 1000;

    this.authenticateTimeout = setTimeout(() => {
      if (this.isAuthenticated$.value) {
        // refresh tokens are not implmented yet so we logout instead.

        //this.getNewAccessToken().subscribe();
        this.logout();
      }
    }, timeout);
  }
}
