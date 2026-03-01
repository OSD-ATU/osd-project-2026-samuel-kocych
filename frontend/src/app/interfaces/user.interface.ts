export type Role = "admin" | "editor" | "";

export interface FavoriteItem {
  id: string;
  source: "internal" | "external";
  image?: string;
}

export interface User {
  _id?: string;
  name: string;
  email: string;
  dateJoined: Date;
  role?: Role;
  favorites?: FavoriteItem[];
}
