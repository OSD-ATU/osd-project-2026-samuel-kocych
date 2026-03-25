import { HttpInterceptorFn } from "@angular/common/http";
import { environment } from "../../environments/environment";
import { catchError, throwError } from "rxjs";
import { inject } from "@angular/core";
import { Router } from "@angular/router";
import { AuthCustomService } from "../services/auth-custom.service";

export const AuthInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const authService = inject(AuthCustomService);

  const apiUri = `${environment.apiUri}`;
  const lambdaUri = `${environment.lambdaUri}`;
  const jwt = localStorage.getItem("token");
  const apiKey = environment.apiKey;

  // attach auth headers for our api and lambda admin api
  let authRequest = req;
  if (req.url.startsWith(apiUri) && jwt) {
    authRequest = req.clone({
      setHeaders: { Authorization: `Bearer ${jwt}` },
    });
  }

  if (req.url.startsWith(lambdaUri)) {
    const headers: Record<string, string> = {};
    if (apiKey) headers["x-api-key"] = apiKey;
    authRequest = req.clone({ setHeaders: headers });
  }

  return next(authRequest).pipe(
    catchError((err) => {
      console.log("Request failed " + err.status);

      if (err.status === 401) {
        authService.logout();
        router.navigate(["/login"]);
      }

      return throwError(() => err);
    }),
  );
};
