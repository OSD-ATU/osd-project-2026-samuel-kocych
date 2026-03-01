import { inject, Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { Observable, of } from "rxjs";
import { catchError, map, shareReplay } from "rxjs/operators";
import { Recipe } from "../interfaces/recipe.interface";
import {
  MealDbMeal,
  MealDbMealSummary,
} from "../interfaces/external-recipe.interface";

@Injectable({
  providedIn: "root",
})
export class ExternalRecipeService {
  private http = inject(HttpClient);

  private readonly baseUrl = "https://www.themealdb.com/api/json/v1/1";

  private allRecipes$?: Observable<Recipe[]>;

  searchRecipes(search?: string): Observable<Recipe[]> {
    const params: any = { s: (search ?? "").trim() };

    return this.http.get<any>(`${this.baseUrl}/search.php`, { params }).pipe(
      map((res) => {
        const meals: MealDbMeal[] = res?.meals || [];
        return meals.map((m) => this.mapMealToRecipe(m));
      }),
      catchError(() => of([])),
    );
  }

  searchRecipesByFirstLetter(letter: string): Observable<Recipe[]> {
    const normalized = (letter || "").trim().toLowerCase().slice(0, 1);
    if (!normalized || !/^[a-z]$/.test(normalized)) return of([]);

    const params: any = { f: normalized };
    return this.http.get<any>(`${this.baseUrl}/search.php`, { params }).pipe(
      map((res) => {
        const meals: MealDbMeal[] = res?.meals || [];
        return meals.map((m) => this.mapMealToRecipe(m));
      }),
      catchError(() => of([])),
    );
  }

  filterByIngredient(ingredient: string): Observable<Recipe[]> {
    const normalized = (ingredient || "").trim();
    if (!normalized) return of([]);

    const apiValue = normalized.replace(/\s+/g, "_");
    const params: any = { i: apiValue };

    return this.http.get<any>(`${this.baseUrl}/filter.php`, { params }).pipe(
      map((res) => {
        const meals: MealDbMealSummary[] = res?.meals || [];
        return meals.map((m) => this.mapMealSummaryToRecipe(m));
      }),
      catchError(() => of([])),
    );
  }

  filterByCategory(category: string): Observable<Recipe[]> {
    const normalized = (category || "").trim();
    if (!normalized) return of([]);

    const params: any = { c: normalized };
    return this.http.get<any>(`${this.baseUrl}/filter.php`, { params }).pipe(
      map((res) => {
        const meals: MealDbMealSummary[] = res?.meals || [];
        return meals.map((m) => this.mapMealSummaryToRecipe(m));
      }),
      catchError(() => of([])),
    );
  }

  filterByArea(area: string): Observable<Recipe[]> {
    const normalized = (area || "").trim();
    if (!normalized) return of([]);

    const params: any = { a: normalized };
    return this.http.get<any>(`${this.baseUrl}/filter.php`, { params }).pipe(
      map((res) => {
        const meals: MealDbMealSummary[] = res?.meals || [];
        return meals.map((m) => this.mapMealSummaryToRecipe(m));
      }),
      catchError(() => of([])),
    );
  }

  listCategories(): Observable<string[]> {
    const params: any = { c: "list" };
    return this.http.get<any>(`${this.baseUrl}/list.php`, { params }).pipe(
      map((res) => {
        const meals: Array<{ strCategory?: string }> = res?.meals || [];
        return meals
          .map((m) => (m.strCategory || "").trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
      }),
      catchError(() => of([])),
    );
  }

  listAreas(): Observable<string[]> {
    const params: any = { a: "list" };
    return this.http.get<any>(`${this.baseUrl}/list.php`, { params }).pipe(
      map((res) => {
        const meals: Array<{ strArea?: string }> = res?.meals || [];
        return meals
          .map((m) => (m.strArea || "").trim())
          .filter(Boolean)
          .sort((a, b) => a.localeCompare(b));
      }),
      catchError(() => of([])),
    );
  }

  getAllRecipes(): Observable<Recipe[]> {
    if (this.allRecipes$) return this.allRecipes$;

    const letters = Array.from({ length: 26 }, (_, i) =>
      String.fromCharCode("a".charCodeAt(0) + i),
    );

    this.allRecipes$ = new Observable<Recipe[]>((subscriber) => {
      let cancelled = false;
      const all: Recipe[] = [];
      let completed = 0;

      const subs = letters.map((l) =>
        this.searchRecipesByFirstLetter(l).subscribe({
          next: (recipes) => {
            if (cancelled) return;
            all.push(...recipes);
          },
          error: () => {
            // ignore
          },
          complete: () => {
            completed++;
            if (completed === letters.length && !cancelled) {
              const unique = new Map<string, Recipe>();
              for (const r of all) {
                if (!r._id) continue;
                if (!unique.has(r._id)) unique.set(r._id, r);
              }
              subscriber.next(Array.from(unique.values()));
              subscriber.complete();
            }
          },
        }),
      );

      return () => {
        cancelled = true;
        subs.forEach((s) => s.unsubscribe());
      };
    }).pipe(shareReplay({ bufferSize: 1, refCount: true }));

    return this.allRecipes$;
  }

  queryRecipes(params: {
    search?: string;
    ingredient?: string;
    category?: string;
    area?: string;
  }): Observable<Recipe[]> {
    const search = (params.search || "").trim();
    const ingredient = (params.ingredient || "").trim();
    const category = (params.category || "").trim();
    const area = (params.area || "").trim();

    if (ingredient) return this.filterByIngredient(ingredient);
    if (category) return this.filterByCategory(category);
    if (area) return this.filterByArea(area);
    if (search) return this.searchRecipes(search);
    return this.getAllRecipes();
  }

  getRecipeById(id: string): Observable<Recipe> {
    const params: any = { i: id };
    return this.http.get<any>(`${this.baseUrl}/lookup.php`, { params }).pipe(
      map((res) => {
        const meal: MealDbMeal | undefined = res?.meals?.[0];
        if (!meal) throw new Error("recipe not found");
        return this.mapMealToRecipe(meal);
      }),
    );
  }

  getRandomRecipe(): Observable<Recipe> {
    return this.http.get<any>(`${this.baseUrl}/random.php`).pipe(
      map((res) => {
        const meal: MealDbMeal | undefined = res?.meals?.[0];
        if (!meal) throw new Error("recipe not found");
        return this.mapMealToRecipe(meal);
      }),
    );
  }

  private mapMealToRecipe(m: MealDbMeal): Recipe {
    const ingredients = Array.from({ length: 20 })
      .map((_, i) => m[`strIngredient${i + 1}`])
      .filter(Boolean);

    return {
      _id: m.idMeal,
      title: m.strMeal,
      ingredients,
      instructions: m.strInstructions,
      image: m.strMealThumb,
      dateCreated: new Date(),
      difficulty: "easy",
    };
  }

  private mapMealSummaryToRecipe(m: MealDbMealSummary): Recipe {
    return {
      _id: m.idMeal,
      title: m.strMeal,
      ingredients: [],
      instructions: "",
      image: m.strMealThumb,
      dateCreated: new Date(),
      difficulty: "easy",
    };
  }
}
