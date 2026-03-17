import { Injectable, inject, InjectionToken } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs";

// injection token for the ga measurement id string
export const GA_MEASUREMENT_ID = new InjectionToken<string>(
  "ga.measurement.id",
);

// extend window type to include gtag
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

@Injectable({
  providedIn: "root",
})
export class GoogleAnalyticsService {
  private router = inject(Router);
  private gaId = inject(GA_MEASUREMENT_ID);

  constructor() {
    this.loadScript();
    this.trackPageViews();
  }

  // dynamically load gtag script and initialize dataLayer
  private loadScript(): void {
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    window.dataLayer = window.dataLayer || [];
    function gtag(...args: any[]): void {
      window.dataLayer.push(args);
    }
    window.gtag = gtag;
    (window.gtag as any)("js", new Date());
    (window.gtag as any)("config", this.gaId, {
      page_path: window.location.pathname,
    });
  }

  // send page_view event on every route change
  private trackPageViews(): void {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e: any) => {
        if (window.gtag) {
          window.gtag("event", "page_view", {
            page_path: e.urlAfterRedirects,
            page_title: document.title,
          });
        }
      });
  }

  // generic event tracker
  trackEvent(category: string, action: string, label?: string): void {
    if (window.gtag) {
      window.gtag("event", action, {
        event_category: category,
        event_label: label,
      });
    }
  }

  // track login
  trackLogin(): void {
    if (window.gtag) {
      window.gtag("event", "login");
    }
  }

  // track new user registration
  trackSignUp(): void {
    if (window.gtag) {
      window.gtag("event", "sign_up");
    }
  }

  // track recipe added to favorites
  trackAddFavorite(recipeId: string): void {
    if (window.gtag) {
      window.gtag("event", "add_to_favorites", { recipe_id: recipeId });
    }
  }

  // track recipe removed from favorites
  trackRemoveFavorite(recipeId: string): void {
    if (window.gtag) {
      window.gtag("event", "remove_from_favorites", { recipe_id: recipeId });
    }
  }
}
