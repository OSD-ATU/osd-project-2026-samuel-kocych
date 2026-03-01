import { CanActivateFn, Router } from "@angular/router";
import { AuthCustomService } from "../services/auth-custom.service";
import { inject } from "@angular/core";

export const editorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthCustomService);
  const router = inject(Router);

  if (!authService.isAuthenticated$.value) {
    return router.createUrlTree(["/login"], {
      queryParams: { returnUrl: state.url },
    });
  }

  const role = authService.currentUser$.value?.role;

  // editor or admin
  if (role === "editor" || role === "admin") {
    return true;
  }

  return router.createUrlTree(["/login"], {
    queryParams: { returnUrl: state.url },
  });
};
