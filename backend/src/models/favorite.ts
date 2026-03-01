export type FavoriteSource = "internal" | "external";

export interface FavoriteItem {
  id: string;
  source: FavoriteSource;
  image?: string;
  addedAt: Date;
}
