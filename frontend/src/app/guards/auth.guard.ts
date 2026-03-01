import { CanActivateFn, Router } from '@angular/router';
import { AuthCustomService } from '../services/auth-custom.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthCustomService);
  const router = inject(Router);

  if (authService.isAuthenticated$.value) {
    return true;
  } else {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
};
