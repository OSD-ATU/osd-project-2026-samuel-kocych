import { Injectable, inject } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { BehaviorSubject, of } from "rxjs";
import { map } from "rxjs/operators";
import { AuthCustomService } from "./auth-custom.service";
import { environment } from "../../environments/environment";
import { FavoriteItem } from "../interfaces/user.interface";

@Injectable({
  providedIn: "root",
})
export class FavoritesService {
  private http = inject(HttpClient);
  private readonly authService = inject(AuthCustomService);

  private apiUrl = `${environment.apiUri}/users/me/favorites`;

  private readonly favoritesSubject = new BehaviorSubject<FavoriteItem[]>([]);

  readonly favoriteItems$ = this.favoritesSubject.asObservable();

  readonly favoriteExternalIds$ = this.favoriteItems$.pipe(
    map((items) =>
      items.filter((x) => x.source === "external").map((x) => x.id),
    ),
  );

  readonly favoriteInternalIds$ = this.favoriteItems$.pipe(
    map((items) =>
      items.filter((x) => x.source === "internal").map((x) => x.id),
    ),
  );

  constructor() {
    // load favorites from db when the auth state changes
    this.authService.isAuthenticated$.subscribe((isAuthenticated) => {
      if (!isAuthenticated) {
        this.favoritesSubject.next([]);
        return;
      }
      this.reload();
    });

    // initial load if already authenticated (e.g. token restored)
    if (this.authService.isAuthenticated$.value) {
      this.reload();
    }
  }

  reload(): void {
    this.http.get<unknown>(this.apiUrl).subscribe({
      next: (res) => {
        const items = FavoritesService.normalizeResponse(res);
        this.favoritesSubject.next(items);
      },
      error: () => {
        // keep current list if refresh fails
      },
    });
  }

  getIdsSnapshot(): string[] {
    return this.favoritesSubject.value.map((x) => x.id);
  }

  isFavorite(
    id?: string | null,
    source: "internal" | "external" = "external",
  ): boolean {
    if (!id) return false;
    const trimmed = id.trim();
    return this.favoritesSubject.value.some(
      (x) => x.id === trimmed && x.source === source,
    );
  }

  getImage(
    id?: string | null,
    source: "internal" | "external" = "external",
  ): string | undefined {
    const trimmed = (id || "").trim();
    if (!trimmed) return undefined;
    return this.favoritesSubject.value.find(
      (x) => x.id === trimmed && x.source === source,
    )?.image;
  }

  add(
    id: string,
    source: "internal" | "external" = "external",
    image?: string | null,
  ): void {
    if (!this.authService.isAuthenticated$.value) return;

    const trimmed = (id || "").trim();
    if (!trimmed) return;

    const nextImage = (image || "").trim() || undefined;
    const existing = this.favoritesSubject.value.find(
      (x) => x.id === trimmed && x.source === source,
    );

    if (existing) {
      if (nextImage && !existing.image) {
        const optimistic = this.favoritesSubject.value.map((x) =>
          x.id === trimmed && x.source === source
            ? { ...x, image: nextImage }
            : x,
        );
        this.favoritesSubject.next(optimistic);

        this.http
          .post<unknown>(this.apiUrl, {
            id: trimmed,
            source,
            image: nextImage,
          })
          .pipe(map((res) => FavoritesService.normalizeResponse(res)))
          .subscribe({
            next: (items) => this.favoritesSubject.next(items),
            error: () => this.reload(),
          });
      }
      return;
    }

    const optimistic = [
      ...this.favoritesSubject.value,
      { id: trimmed, source, image: nextImage },
    ];
    this.favoritesSubject.next(optimistic);

    this.http
      .post<unknown>(this.apiUrl, { id: trimmed, source, image: nextImage })
      .pipe(map((res) => FavoritesService.normalizeResponse(res)))
      .subscribe({
        next: (items) => this.favoritesSubject.next(items),
        error: () => this.reload(),
      });
  }

  remove(id: string, source: "internal" | "external" = "external"): void {
    if (!this.authService.isAuthenticated$.value) return;

    const trimmed = (id || "").trim();
    if (!trimmed) return;

    const optimistic = this.favoritesSubject.value.filter(
      (x) => !(x.id === trimmed && x.source === source),
    );
    this.favoritesSubject.next(optimistic);

    const url = `${this.apiUrl}/${encodeURIComponent(source)}/${encodeURIComponent(trimmed)}`;
    this.http
      .delete<unknown>(url)
      .pipe(map((res) => FavoritesService.normalizeResponse(res)))
      .subscribe({
        next: (items) => this.favoritesSubject.next(items),
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

    if (!this.authService.isAuthenticated$.value) return;

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
