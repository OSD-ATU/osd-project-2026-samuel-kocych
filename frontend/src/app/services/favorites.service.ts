import { computed, Injectable, inject, signal } from "@angular/core";
import { toObservable } from "@angular/core/rxjs-interop";
import { HttpClient } from "@angular/common/http";
import { of } from "rxjs";
import { AuthCustomService } from "./auth-custom.service";
import { GoogleAnalyticsService } from "./google-analytics.service";
import { environment } from "../../environments/environment";
import { FavoriteItem } from "../interfaces/user.interface";

@Injectable({
  providedIn: "root",
})
export class FavoritesService {
  private http = inject(HttpClient);
  private readonly authService = inject(AuthCustomService);
  private ga = inject(GoogleAnalyticsService);

  private apiUrl = `${environment.apiUri}/users/me/favorites`;
  private readonly favoritesState = signal<FavoriteItem[]>([]);

  readonly favoriteItems = this.favoritesState.asReadonly();
  readonly favoriteExternalIds = computed(() =>
    this.favoriteItems()
      .filter((x) => x.source === "external")
      .map((x) => x.id),
  );
  readonly favoriteInternalIds = computed(() =>
    this.favoriteItems()
      .filter((x) => x.source === "internal")
      .map((x) => x.id),
  );
  readonly favoriteCount = computed(() => this.favoriteItems().length);

  readonly favoriteItems$ = toObservable(this.favoriteItems);
  readonly favoriteExternalIds$ = toObservable(this.favoriteExternalIds);
  readonly favoriteInternalIds$ = toObservable(this.favoriteInternalIds);

  constructor() {
    // load favorites from db when the auth state changes
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        this.favoritesState.set([]);
        return;
      }
      this.reload();
    });

    // initial load if already authenticated (e.g. token restored)
    if (this.authService.isAuthenticated()) {
      this.reload();
    }
  }

  reload(): void {
    this.http.get<unknown>(this.apiUrl).subscribe({
      next: (res) => {
        const items = FavoritesService.normalizeResponse(res);
        this.favoritesState.set(items);
      },
      error: () => {
        // keep current list if refresh fails
      },
    });
  }

  getIdsSnapshot(): string[] {
    return this.favoriteItems().map((x) => x.id);
  }

  isFavorite(
    id?: string | null,
    source: "internal" | "external" = "external",
  ): boolean {
    if (!id) return false;
    const trimmed = id.trim();
    return this.favoriteItems().some(
      (x) => x.id === trimmed && x.source === source,
    );
  }

  getImage(
    id?: string | null,
    source: "internal" | "external" = "external",
  ): string | undefined {
    const trimmed = (id || "").trim();
    if (!trimmed) return undefined;
    return this.favoriteItems().find(
      (x) => x.id === trimmed && x.source === source,
    )?.image;
  }

  add(
    id: string,
    source: "internal" | "external" = "external",
    image?: string | null,
  ): void {
    if (!this.authService.isAuthenticated()) return;

    const trimmed = (id || "").trim();
    if (!trimmed) return;

    const nextImage = (image || "").trim() || undefined;
    const existing = this.favoriteItems().find(
      (x) => x.id === trimmed && x.source === source,
    );

    if (existing) {
      if (nextImage && !existing.image) {
        const optimistic = this.favoriteItems().map((x) =>
          x.id === trimmed && x.source === source
            ? { ...x, image: nextImage }
            : x,
        );
        this.favoritesState.set(optimistic);

        this.http
          .post<unknown>(this.apiUrl, {
            id: trimmed,
            source,
            image: nextImage,
          })
          .subscribe({
            next: (res) =>
              this.favoritesState.set(FavoritesService.normalizeResponse(res)),
            error: () => this.reload(),
          });
      }
      return;
    }

    const optimistic = [
      ...this.favoriteItems(),
      { id: trimmed, source, image: nextImage },
    ];
    this.favoritesState.set(optimistic);

    // track add favorite event
    this.ga.trackAddFavorite(trimmed);

    this.http
      .post<unknown>(this.apiUrl, { id: trimmed, source, image: nextImage })
      .subscribe({
        next: (res) =>
          this.favoritesState.set(FavoritesService.normalizeResponse(res)),
        error: () => this.reload(),
      });
  }

  remove(id: string, source: "internal" | "external" = "external"): void {
    if (!this.authService.isAuthenticated()) return;

    const trimmed = (id || "").trim();
    if (!trimmed) return;

    const optimistic = this.favoriteItems().filter(
      (x) => !(x.id === trimmed && x.source === source),
    );
    this.favoritesState.set(optimistic);

    // track remove favorite event
    this.ga.trackRemoveFavorite(trimmed);

    const url = `${this.apiUrl}/${encodeURIComponent(source)}/${encodeURIComponent(trimmed)}`;
    this.http.delete<unknown>(url).subscribe({
      next: (res) =>
        this.favoritesState.set(FavoritesService.normalizeResponse(res)),
      error: () => this.reload(),
    });
  }

  toggle(
    id?: string | null,
    source: "internal" | "external" = "external",
    image?: string | null,
  ): void {
    const trimmed = (id || "").trim();
    if (!trimmed) return;

    if (!this.authService.isAuthenticated()) return;

    if (this.isFavorite(trimmed, source)) this.remove(trimmed, source);
    else this.add(trimmed, source, image);
  }

  private static normalizeResponse(res: unknown): FavoriteItem[] {
    const anyRes: any = res;
    const candidates = Array.isArray(anyRes)
      ? anyRes
      : Array.isArray(anyRes?.items)
        ? anyRes.items
        : [];

    return candidates
      .map((x: any) => {
        const id = typeof x?.id === "string" ? x.id.trim() : "";
        const source: "internal" | "external" =
          x?.source === "internal" ? "internal" : "external";
        const image = typeof x?.image === "string" ? x.image.trim() : "";
        return {
          id,
          source,
          image: image || undefined,
        } as FavoriteItem;
      })
      .filter((x: FavoriteItem) => !!x.id);
  }
}
