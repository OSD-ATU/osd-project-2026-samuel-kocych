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
import {
  GA_MEASUREMENT_ID,
  GoogleAnalyticsService,
} from "./services/google-analytics.service";
import { environment } from "../environments/environment";

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideHttpClient(withInterceptors([AuthInterceptor])),
    // provide the ga measurement id from environment
    { provide: GA_MEASUREMENT_ID, useValue: environment.googleAnalyticsId },
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
