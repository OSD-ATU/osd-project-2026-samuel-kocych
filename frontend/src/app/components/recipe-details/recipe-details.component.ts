import { Component, inject, signal } from "@angular/core";
import { FormBuilder, Validators, ReactiveFormsModule } from "@angular/forms";
import { CommonModule } from "@angular/common";
import { ActivatedRoute, Router, RouterModule } from "@angular/router";
import { switchMap, catchError, of, BehaviorSubject, tap } from "rxjs";
import { InternalRecipeService } from "../../services/internal-recipe.service";
import { ExternalRecipeService } from "../../services/external-recipe.service";
import { Recipe } from "../../interfaces/recipe.interface";
import { MatCardModule } from "@angular/material/card";
import { MatButtonModule } from "@angular/material/button";
import { MatIconModule } from "@angular/material/icon";
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner";
import { MatFormFieldModule } from "@angular/material/form-field";
import { MatInputModule } from "@angular/material/input";
import { MatListModule } from "@angular/material/list";
import { MatDividerModule } from "@angular/material/divider";
import { MatChipsModule } from "@angular/material/chips";
import { MatDialog } from "@angular/material/dialog";
import { MatSnackBar } from "@angular/material/snack-bar";
import { ConfirmDialogComponent } from "../shared/confirm-dialog/confirm-dialog.component";
import { AuthCustomService } from "../../services/auth-custom.service";
import { FavoritesService } from "../../services/favorites.service";
import type { FavoriteItem } from "../../interfaces/user.interface";
import { GoogleAnalyticsService } from "../../services/google-analytics.service";

@Component({
  selector: "app-recipe-details",
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatListModule,
    MatDividerModule,
    MatChipsModule,
  ],
  templateUrl: "./recipe-details.component.html",
  styleUrls: ["./recipe-details.component.scss"],
})
export class RecipeDetailsComponent {
  // services
  private route = inject(ActivatedRoute);
  private internalService = inject(InternalRecipeService);
  private externalService = inject(ExternalRecipeService);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);
  private favorites = inject(FavoritesService);
  private ga = inject(GoogleAnalyticsService);

  // state
  showFull = signal(false);
  submitting = false;
  recipeId = "";
  isExternal = false;

  readonly placeholderImageUrl = "https://placehold.co/900x600?text=Recipe";
  private reloadSubject = new BehaviorSubject<void>(undefined);
  private authService = inject(AuthCustomService);
  isAuthenticated$ = this.authService.isAuthenticated$;
  isEditor$ = this.authService.isEditor$;
  isAdmin$ = this.authService.isAdmin$;

  // recipe stream by id
  recipe$ = this.route.paramMap.pipe(
    switchMap((params) => {
      this.recipeId = params.get("id") ?? "";
      this.isExternal = this.route.snapshot.data?.["source"] === "external";
      return this.reloadSubject.pipe(
        switchMap(() =>
          this.isExternal
            ? this.externalService.getRecipeById(this.recipeId)
            : this.internalService.getRecipeById(this.recipeId),
        ),
        tap((recipe) => {
          if (!recipe?._id) return;
          this.ga.trackViewItem({
            id: recipe._id,
            name: recipe.title,
            source: this.isExternal ? "external" : "internal",
          });
        }),
        catchError(() => of(null as unknown as Recipe)),
      );
    }),
  );

  // note form
  commentForm = inject(FormBuilder).group({
    text: ["", [Validators.required, Validators.maxLength(300)]],
  });

  get text() {
    return this.commentForm.get("text");
  }

  // toggle full instructions
  toggleDescription(): void {
    this.showFull.update((v) => !v);
  }

  // add note
  submitComment(): void {
    if (this.isExternal) return;
    if (this.commentForm.invalid || this.submitting) return;

    this.submitting = true;
    this.internalService
      .addComment(this.recipeId, this.commentForm.value as { text: string })
      .subscribe({
        next: () => {
          this.commentForm.reset();
          this.submitting = false;
          this.reloadSubject.next();
          this.showSnackBar("Note added successfully", "success");
        },
        error: (err: Error) => {
          this.submitting = false;
          this.showSnackBar("Failed to add note: " + err.message, "error");
        },
      });
  }

  // delete note with confirm
  deleteComment(commentId: string): void {
    if (this.isExternal) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "400px",
      data: {
        title: "Delete Note",
        message: "Are you sure you want to delete this note?",
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed) {
        this.internalService.deleteComment(this.recipeId, commentId).subscribe({
          next: () => {
            this.reloadSubject.next();
            this.showSnackBar("Note deleted", "success");
          },
          error: (err: Error) =>
            this.showSnackBar("Failed to delete note: " + err.message, "error"),
        });
      }
    });
  }

  // delete recipe with confirm
  deleteRecipe(): void {
    if (this.isExternal) return;
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: "450px",
      data: {
        title: "Delete Recipe",
        message: "Are you sure you want to delete this recipe?",
      },
    });

    dialogRef.afterClosed().subscribe((confirmed) => {
      if (confirmed && this.recipeId) {
        this.internalService.deleteRecipe(this.recipeId).subscribe({
          next: () => {
            this.showSnackBar("Recipe deleted", "success");
            this.router.navigateByUrl("/");
          },
          error: (err: Error) =>
            this.showSnackBar(
              "Failed to delete recipe: " + err.message,
              "error",
            ),
        });
      }
    });
  }

  // show snackbar notification
  private showSnackBar(message: string, type: "success" | "error"): void {
    this.snackBar.open(message, type === "success" ? "OK" : "Dismiss", {
      duration: type === "success" ? 4000 : 15000,
      panelClass: [`${type}-snackbar`],
      horizontalPosition: "end",
      verticalPosition: "bottom",
    });
  }

  getRecipeImage(recipe: Recipe | null | undefined): string {
    if (!recipe) return this.placeholderImageUrl;
    return recipe.image || this.placeholderImageUrl;
  }

  isFavorite(
    id?: string,
    source: "external" | "internal" = "external",
  ): boolean {
    return this.favorites.isFavorite(id, source);
  }

  toggleFavorite(
    id?: string,
    source: "external" | "internal" = "external",
    image?: string,
  ): void {
    this.favorites.toggle(id, source, image);
  }
}
