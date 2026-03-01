import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthCustomService } from '../services/auth-custom.service';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthCustomService);
  const router = inject(Router);

  if (authService.currentUser$.value?.role === 'admin') {
    return true;
  } else {
    return router.createUrlTree(['/login'], {
      queryParams: { returnUrl: state.url },
    });
  }
};
