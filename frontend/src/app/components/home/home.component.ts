import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { MatButtonModule } from "@angular/material/button";
import { ActivatedRoute } from "@angular/router";
import { InternalRecipesComponent } from "../recipe-list/recipe-list.component";
import { ExternalRecipesComponent } from "../external-recipes/external-recipes.component";
import { AuthCustomService } from "../../services/auth-custom.service";
import { GoogleAnalyticsService } from "../../services/google-analytics.service";

type HomeTab = "private" | "public";

@Component({
  selector: "app-home",
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    InternalRecipesComponent,
    ExternalRecipesComponent,
  ],
  templateUrl: "./home.component.html",
  styleUrls: ["./home.component.scss"],
})
export class HomeComponent {
  private route = inject(ActivatedRoute);
  private authService = inject(AuthCustomService);
  private ga = inject(GoogleAnalyticsService);

  tab: HomeTab = "public";
  canAccessPrivate = false;

  constructor() {
    this.authService.currentUser$.subscribe((user) => {
      this.canAccessPrivate = user?.role === "editor" || user?.role === "admin";

      const requestedTab = this.route.snapshot.queryParamMap.get("tab");
      if (requestedTab === "private" && this.canAccessPrivate) {
        this.tab = "private";
      } else {
        this.tab = "public";
      }
    });
  }

  setTab(tab: HomeTab): void {
    if (tab === "private" && !this.canAccessPrivate) return;
    this.ga.trackButtonClick(`home_tab_${tab}`, "home");
    this.tab = tab;
  }
}
