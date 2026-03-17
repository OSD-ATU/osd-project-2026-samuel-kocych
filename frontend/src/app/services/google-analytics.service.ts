import { Injectable, inject } from "@angular/core";
import { Router, NavigationEnd } from "@angular/router";
import { filter } from "rxjs";
import { environment } from "../../environments/environment";

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

  constructor() {
    this.configureAnalytics();
    this.trackPageViews();
  }

  private configureAnalytics(): void {
    if (window.gtag) {
      window.gtag("config", environment.googleAnalyticsId, {
        send_page_view: false,
      });
    }
  }

  private getDebugParams(): Record<string, unknown> {
    return environment.production ? {} : { debug_mode: true };
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
            page_location: window.location.href,
            page_referrer: document.referrer,
            ...this.getDebugParams(),
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
        ...this.getDebugParams(),
      });
    }
  }

  trackButtonClick(buttonName: string, section?: string): void {
    if (window.gtag) {
      window.gtag("event", "button_click", {
        button_name: buttonName,
        section,
        ...this.getDebugParams(),
      });
    }
  }

  trackBookCoverButtonClick(
    recipeId: string,
    source: "internal" | "external",
    section?: string,
  ): void {
    if (window.gtag) {
      window.gtag("event", "book_cover_button_click", {
        recipe_id: recipeId,
        recipe_source: source,
        section,
        ...this.getDebugParams(),
      });
    }
  }

  trackSelectItem(item: {
    id: string;
    name?: string;
    source: "internal" | "external";
  }): void {
    if (window.gtag) {
      window.gtag("event", "select_item", {
        item_list_name: `${item.source}_recipes`,
        items: [
          {
            item_id: item.id,
            item_name: item.name ?? "Recipe",
            item_category: item.source,
          },
        ],
        ...this.getDebugParams(),
      });
    }
  }

  trackViewItem(item: {
    id: string;
    name?: string;
    source: "internal" | "external";
  }): void {
    if (window.gtag) {
      window.gtag("event", "view_item", {
        currency: "USD",
        value: 0,
        items: [
          {
            item_id: item.id,
            item_name: item.name ?? "Recipe",
            item_category: item.source,
          },
        ],
        ...this.getDebugParams(),
      });
    }
  }

  // track login
  trackLogin(): void {
    if (window.gtag) {
      window.gtag("event", "login", {
        ...this.getDebugParams(),
      });
    }
  }

  // track new user registration
  trackSignUp(): void {
    if (window.gtag) {
      window.gtag("event", "sign_up", {
        ...this.getDebugParams(),
      });
    }
  }

  // track recipe added to favorites
  trackAddFavorite(recipeId: string): void {
    if (window.gtag) {
      window.gtag("event", "add_to_favorites", {
        recipe_id: recipeId,
        ...this.getDebugParams(),
      });
    }
  }

  // track recipe removed from favorites
  trackRemoveFavorite(recipeId: string): void {
    if (window.gtag) {
      window.gtag("event", "remove_from_favorites", {
        recipe_id: recipeId,
        ...this.getDebugParams(),
      });
    }
  }

  setUserProperties(user: { id?: string; role?: string | null }): void {
    if (window.gtag) {
      if (user.id) {
        window.gtag("set", "user_id", user.id);
      }

      window.gtag("set", "user_properties", {
        role: user.role ?? "guest",
      });
    }
  }

  clearUserProperties(): void {
    if (window.gtag) {
      window.gtag("set", "user_id", null);
      window.gtag("set", "user_properties", {
        role: "guest",
      });
    }
  }
}
