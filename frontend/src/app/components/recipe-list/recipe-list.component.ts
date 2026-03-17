import { Component, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { Router } from "@angular/router";
import { InternalRecipeService } from "../../services/internal-recipe.service";
import { Recipe } from "../../interfaces/recipe.interface";
import { AuthCustomService } from "../../services/auth-custom.service";
import { FavoritesService } from "../../services/favorites.service";
import { BehaviorSubject, Observable, of } from "rxjs";
import { catchError, map, switchMap } from "rxjs/operators";
import {
  MatCardContent,
  MatCard,
  MatCardActions,
  MatCardHeader,
  MatCardSubtitle,
  MatCardTitle,
} from "@angular/material/card";
import { MatList, MatListItem } from "@angular/material/list";
import { MatIcon } from "@angular/material/icon";
import { MatChipSet, MatChip } from "@angular/material/chips";
import { FormsModule } from "@angular/forms";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatSelectModule } from "@angular/material/select";
import { MatButtonModule } from "@angular/material/button";
import { GoogleAnalyticsService } from "../../services/google-analytics.service";

type SortField = "title" | "dateCreated" | "dateUpdated";
type SortOrder = "asc" | "desc";
type Difficulty = "easy" | "medium" | "hard";

@Component({
  selector: "app-internal-recipes",
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatCardContent,
    MatCardActions,
    MatList,
    MatListItem,
    MatIcon,
    MatCard,
    MatCardHeader,
    MatCardSubtitle,
    MatChipSet,
    MatChip,
    MatCardTitle,
  ],
  templateUrl: "./recipe-list.component.html",
  styleUrls: ["./recipe-list.component.scss"],
})
export class InternalRecipesComponent {
  private recipeService = inject(InternalRecipeService);
  private router = inject(Router);
  private authService = inject(AuthCustomService);
  private favoritesService = inject(FavoritesService);
  private ga = inject(GoogleAnalyticsService);

  isAuthenticated$ = this.authService.isAuthenticated$;

  searchTerm = "";
  ingredient = "";
  difficulty: Difficulty | "" = "";
  sortField: SortField = "dateUpdated";
  sortOrder: SortOrder = "desc";
  currentPage = 1;
  pageSize = 10;
  showFilters = false;

  totalRecipes: number | null = null;
  randomRecipe: Recipe | null = null;
  loadingRandom = false;

  readonly placeholderImageUrl = "https://placehold.co/600x400?text=Recipe";

  private searchTrigger$ = new BehaviorSubject<void>(undefined);

  recipesData$: Observable<{
    recipes: Recipe[];
    total: number;
    page: number;
    totalPages: number;
    hasSearched: boolean;
  }> = this.searchTrigger$.pipe(
    switchMap(() => {
      return this.recipeService
        .getRecipes(
          this.searchTerm || undefined,
          this.ingredient || undefined,
          this.difficulty || undefined,
          this.sortField,
          this.sortOrder,
          this.currentPage,
          this.pageSize,
        )
        .pipe(
          map((response) => ({
            recipes: response.recipes,
            total: response.total,
            page: response.page,
            totalPages: Math.max(1, Math.ceil(response.total / this.pageSize)),
            hasSearched:
              !!this.searchTerm || !!this.ingredient || !!this.difficulty,
          })),
          catchError(() =>
            of({
              recipes: [],
              total: 0,
              page: 1,
              totalPages: 1,
              hasSearched: false,
            }),
          ),
        );
    }),
  );

  constructor() {
    this.loadTotalRecipes();
    this.searchTrigger$.next();
  }

  onSearch(isNewSearch: boolean): void {
    if (isNewSearch) this.currentPage = 1;
    this.searchTrigger$.next();
  }

  private loadTotalRecipes(): void {
    this.recipeService.getTotalRecipes().subscribe({
      next: (res) => (this.totalRecipes = res.totalRecipes),
      error: () => (this.totalRecipes = null),
    });
  }

  loadRandom(): void {
    this.ga.trackButtonClick("random_recipe", "internal_recipes");
    this.loadingRandom = true;
    this.recipeService.getRandomRecipe().subscribe({
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
    this.ga.trackSelectItem({ id, name: title, source: "internal" });
    this.ga.trackBookCoverButtonClick(id, "internal", "internal_recipes");
    this.router.navigate(["/recipes", id]);
  }

  isFavorite(id?: string | null): boolean {
    return this.favoritesService.isFavorite(id, "internal");
  }

  toggleFavorite(id?: string | null, image?: string | null): void {
    this.favoritesService.toggle(id, "internal", image);
  }
}
