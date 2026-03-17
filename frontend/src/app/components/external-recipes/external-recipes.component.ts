import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import {
  MatCard,
  MatCardActions,
  MatCardContent,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from "@angular/material/card";
import { MatList, MatListItem } from "@angular/material/list";
import { MatIcon } from "@angular/material/icon";
import { MatChip, MatChipSet } from "@angular/material/chips";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { FormsModule } from "@angular/forms";
import { ExternalRecipeService } from "../../services/external-recipe.service";
import { FavoritesService } from "../../services/favorites.service";
import { Recipe } from "../../interfaces/recipe.interface";
import { AuthCustomService } from "../../services/auth-custom.service";
import { GoogleAnalyticsService } from "../../services/google-analytics.service";

type SortField = "title" | "dateCreated" | "dateUpdated";
type SortOrder = "asc" | "desc";

@Component({
  selector: "app-external-recipes",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCard,
    MatCardActions,
    MatCardHeader,
    MatCardContent,
    MatCardTitle,
    MatCardSubtitle,
    MatList,
    MatListItem,
    MatIcon,
    MatChipSet,
    MatChip,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
  ],
  templateUrl: "./external-recipes.component.html",
  styleUrls: ["./external-recipes.component.scss"],
})
export class ExternalRecipesComponent {
  private externalService = inject(ExternalRecipeService);
  private favorites = inject(FavoritesService);
  private authService = inject(AuthCustomService);
  private router = inject(Router);
  private ga = inject(GoogleAnalyticsService);

  isAuthenticated$ = this.authService.isAuthenticated$;

  searchTerm = "";
  ingredient = "";
  category = "";
  area = "";
  sortField: SortField = "title";
  sortOrder: SortOrder = "asc";
  currentPage = 1;
  pageSize = 10;
  showFilters = false;

  categories: string[] = [];
  areas: string[] = [];

  randomRecipe: Recipe | null = null;
  loadingRandom = false;

  readonly placeholderImageUrl = "https://placehold.co/600x400?text=Recipe";

  private searchTrigger$ = new BehaviorSubject<void>(undefined);

  recipesData$: Observable<{
    recipes: Recipe[];
    total: number;
    page: number;
    totalPages: number;
  }> = this.searchTrigger$.pipe(
    switchMap(() =>
      this.externalService
        .queryRecipes({
          search: this.searchTerm || undefined,
          ingredient: this.ingredient || undefined,
          category: this.category || undefined,
          area: this.area || undefined,
        })
        .pipe(
          map((recipes) => {
            const sorted = this.applySort(recipes);
            const total = sorted.length;
            const totalPages = Math.max(1, Math.ceil(total / this.pageSize));
            const page = Math.min(Math.max(1, this.currentPage), totalPages);
            const start = (page - 1) * this.pageSize;
            const pageRecipes = sorted.slice(start, start + this.pageSize);
            return { recipes: pageRecipes, total, page, totalPages };
          }),
          catchError(() =>
            of({ recipes: [], total: 0, page: 1, totalPages: 1 }),
          ),
        ),
    ),
  );

  constructor() {
    this.externalService.listCategories().subscribe({
      next: (items) => (this.categories = items),
      error: () => (this.categories = []),
    });
    this.externalService.listAreas().subscribe({
      next: (items) => (this.areas = items),
      error: () => (this.areas = []),
    });
    this.searchTrigger$.next();
  }

  onSearch(isNewSearch: boolean): void {
    const ingredient = this.ingredient.trim();
    const category = this.category.trim();
    const area = this.area.trim();

    if (ingredient) {
      this.category = "";
      this.area = "";
    } else if (category) {
      this.ingredient = "";
      this.area = "";
    } else if (area) {
      this.ingredient = "";
      this.category = "";
    }

    if (isNewSearch) this.currentPage = 1;
    this.searchTrigger$.next();
  }

  loadRandom(): void {
    this.ga.trackButtonClick("random_recipe", "external_recipes");
    this.loadingRandom = true;
    this.externalService.getRandomRecipe().subscribe({
      next: (recipe) => {
        this.randomRecipe = recipe;
        this.loadingRandom = false;
      },
      error: () => (this.loadingRandom = false),
    });
  }

  clearRandom(): void {
    this.randomRecipe = null;
  }

  getRecipeImage(recipe: Recipe | null | undefined): string {
    if (!recipe) return this.placeholderImageUrl;
    return recipe.image || this.placeholderImageUrl;
  }

  getPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.onSearch(false);
    }
  }

  getNextPage(totalResults: number): void {
    const totalPages = Math.ceil(totalResults / this.pageSize);
    if (this.currentPage < totalPages) {
      this.currentPage++;
      this.onSearch(false);
    }
  }

  goToDetails(id?: string, title?: string): void {
    if (!id) return;
    this.ga.trackSelectItem({ id, name: title, source: "external" });
    this.ga.trackBookCoverButtonClick(id, "external", "external_recipes");
    this.router.navigate(["/public-recipes", id]);
  }

  isFavorite(id?: string): boolean {
    return this.favorites.isFavorite(id, "external");
  }

  toggleFavorite(id?: string, image?: string): void {
    this.favorites.toggle(id, "external", image);
  }

  private applySort(recipes: Recipe[]): Recipe[] {
    const field = this.sortField;
    const order = this.sortOrder;

    const sorted = [...recipes].sort((a, b) => {
      if (field === "title") {
        const av = (a.title || "").toLowerCase();
        const bv = (b.title || "").toLowerCase();
        return av.localeCompare(bv);
      }

      const aDate = (a as any)[field]
        ? new Date((a as any)[field]).getTime()
        : 0;
      const bDate = (b as any)[field]
        ? new Date((b as any)[field]).getTime()
        : 0;
      return aDate - bDate;
    });

    return order === "asc" ? sorted : sorted.reverse();
  }
}
