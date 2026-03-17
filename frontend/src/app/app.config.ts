import {
  APP_INITIALIZER,
  ApplicationConfig,
  inject,
  provideZoneChangeDetection,
} from "@angular/core";
import { provideRouter } from "@angular/router";
import { provideHttpClient, withInterceptors } from "@angular/common/http";

import { routes } from "./app.routes";
import { AuthInterceptor } from "./interceptors/auth.interceptor";
import { GoogleAnalyticsService } from "./services/google-analytics.service";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    GoogleAnalyticsService,
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => () => {
        inject(GoogleAnalyticsService);
      },
    },
  ],
};
