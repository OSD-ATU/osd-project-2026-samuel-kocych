import { computed, inject, Injectable, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { tap } from "rxjs/operators";
import { User } from "../interfaces/user.interface";
import { HttpClient } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { GoogleAnalyticsService } from "./google-analytics.service";

@Injectable({
  providedIn: "root",
})
export class AuthCustomService {
  private http = inject(HttpClient);
  private ga = inject(GoogleAnalyticsService);
  readonly currentUser = signal<User | null>(null);
  readonly isAuthenticated = signal(false);
  readonly role = computed(() => this.currentUser()?.role ?? null);
  readonly isEditor = computed(
    () => this.role() === "editor" || this.role() === "admin",
  );
  readonly isAdmin = computed(() => this.role() === "admin");

  readonly currentUser$ = toObservable(this.currentUser);
  readonly isAuthenticated$ = toObservable(this.isAuthenticated);
  readonly role$ = toObservable(this.role);
  readonly isEditor$ = toObservable(this.isEditor);
  readonly isAdmin$ = toObservable(this.isAdmin);

  private authenticateTimeout: any;

  constructor() {
    const userJson = localStorage.getItem("user");
    if (userJson) {
      try {
        const user: User = JSON.parse(userJson);
        this.currentUser.set(user);
      } catch (err) {
        console.error("Error parsing stored user", err);
        this.currentUser.set(null);
      }
    }

    const token = localStorage.getItem("token");

    // if there is a token we need to check if it has expired
    if (token) {
      try {
        const payloadBase64 = token.split(".")[1];
        if (payloadBase64) {
          const payload = JSON.parse(atob(payloadBase64));
          const expires = payload.exp * 1000;
          if (expires > Date.now()) {
            this.isAuthenticated.set(true);
            this.startAuthenticateTimer(expires);
          } else {
            this.logout();
          }
        }
      } catch (err) {
        console.error("Invalid token in localStorage", err);
        this.logout();
      }
    }
  }

  login(email: string, password: string) {
    return this.http
      .post<{ user: User; token: string }>(`${environment.apiUri}/auth/login`, {
        email,
        password,
      })
      .pipe(
        tap((response: { user: User; token: string }) => {
          localStorage.setItem("user", JSON.stringify(response.user));
          localStorage.setItem("token", response.token);
          this.currentUser.set(response.user);
          this.isAuthenticated.set(true);
          // track successful login event
          this.ga.trackLogin();
          try {
            const payloadBase64 = response.token.split(".")[1];
            if (payloadBase64) {
              const payload = JSON.parse(atob(payloadBase64));
              const expires = payload.exp * 1000;
              this.startAuthenticateTimer(expires);
            }
          } catch {}
        }),
      );
  }

  register(name: string, email: string, password: string, role: any) {
    return this.http
      .post(`${environment.apiUri}/auth/register`, {
        name,
        email,
        password,
        role,
      })
      .pipe(
        // track successful registration event
        tap(() => this.ga.trackSignUp()),
      );
  }

  public logout() {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
  }

  private startAuthenticateTimer(expires: number) {
    // set a timeout to re-authenticate with the api one minute before the token expires

    const timeout = expires - Date.now() - 60 * 1000;

    this.authenticateTimeout = setTimeout(() => {
      if (this.isAuthenticated()) {
        // refresh tokens are not implmented yet so we logout instead.

        //this.getNewAccessToken().subscribe();
        this.logout();
      }
    }, timeout);
  }
}
