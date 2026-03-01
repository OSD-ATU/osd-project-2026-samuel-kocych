import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';

import {
  FavoriteRecipeItem,
  FavoritesService,
} from '../../services/favorites.service';
import { ExternalRecipeService } from '../../services/external-recipe.service';
import { InternalRecipeService } from '../../services/internal-recipe.service';
import { Recipe } from '../../interfaces/recipe.interface';

@Component({
  selector: 'app-favorites',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatListModule,
  ],
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
})
export class FavoritesComponent {
  private favorites = inject(FavoritesService);
  private externalService = inject(ExternalRecipeService);
  private internalService = inject(InternalRecipeService);
  private router = inject(Router);

  readonly placeholderImageUrl = 'https://placehold.co/600x400?text=Recipe';

  favoritesData$: Observable<{
    items: FavoriteRecipeItem[];
    cards: { item: FavoriteRecipeItem; recipe: Recipe }[];
  }> = this.favorites.favoriteItems$.pipe(
    switchMap((items) => {
      if (!items.length) return of({ items, cards: [] });

      return forkJoin(
        items.map((item) => {
          const request$ =
            item.source === 'internal'
              ? this.internalService.getRecipeById(item.id)
              : this.externalService.getRecipeById(item.id);

          return request$.pipe(
            map((recipe) => ({ item, recipe })),
            catchError(() =>
              of(
                null as unknown as { item: FavoriteRecipeItem; recipe: Recipe },
              ),
            ),
          );
        }),
      ).pipe(
        map((cards) => ({
          items,
          cards: cards.filter(Boolean) as {
            item: FavoriteRecipeItem;
            recipe: Recipe;
          }[],
        })),
        catchError(() => of({ items, cards: [] })),
      );
    }),
  );

  remove(item?: FavoriteRecipeItem): void {
    if (!item?.id) return;
    this.favorites.remove(item.id, item.source);
  }

  goToDetails(item?: FavoriteRecipeItem): void {
    if (!item?.id) return;
    this.router.navigate([
      item.source === 'internal' ? '/recipes' : '/public-recipes',
      item.id,
    ]);
  }

  getRecipeImage(
    card: { item: FavoriteRecipeItem; recipe: Recipe } | null | undefined,
  ): string {
    if (!card?.recipe) return this.placeholderImageUrl;
    return (
      card.recipe.image ||
      this.favorites.getImage(card.item.id, card.item.source) ||
      this.placeholderImageUrl
    );
  }
}
