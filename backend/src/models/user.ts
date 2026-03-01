import { ObjectId } from "mongodb";
import { z } from "zod";
import { FavoriteItem } from "./favorite";

export interface User {
  _id?: ObjectId;
  name: string;
  email: string;
  password: string; // hashed
  dateJoined: Date;
  role: Role;
  favorites: FavoriteItem[];
}

export enum Role {
  Admin = "admin",
  Editor = "editor",
  User = "", // regular user
}

// validation schemas using zod
export const createUserSchema = z.object({
  name: z.string().min(1, "Name is required").max(20, "Name too long"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password too short"),
  role: z.enum(["admin", "editor", ""]),
});
