import { ObjectId } from "mongodb";
import { z } from "zod";

export interface Recipe {
  _id?: ObjectId;
  ownerId: ObjectId;
  title: string;
  ingredients: string[];
  instructions: string;
  notes: Note[];
  dateCreated: Date;
  dateUpdated?: Date;
  difficulty?: "easy" | "medium" | "hard";
  image?: string;
}

export interface Note {
  _id?: ObjectId;
  text: string;
  date: Date;
}

// validation schemas using zod
// recipe schemas
export const createRecipeSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  ingredients: z
    .array(z.string())
    .min(1, "At least one ingredient is required")
    .max(50, "Too many ingredients"),
  instructions: z
    .string()
    .min(1, "Instructions are required")
    .max(5000, "Instructions too long"),
  difficulty: z.enum(["easy", "medium", "hard"]).optional().default("medium"),
  image: z.string().trim().url("Image must be a valid URL").optional(),
});

export const updateRecipeSchema = z.object({
  title: z
    .string()
    .min(1, "Title cannot be empty")
    .max(200, "Title too long")
    .optional(),
  ingredients: z
    .array(z.string())
    .min(1, "Ingredients cannot be empty")
    .max(50, "Too many ingredients")
    .optional(),
  instructions: z
    .string()
    .min(1, "Instructions cannot be empty")
    .max(5000, "Instructions too long")
    .optional(),
  difficulty: z.enum(["easy", "medium", "hard"]).optional(),
  image: z.string().trim().url("Image must be a valid URL").optional(),
});

// note schemas
export const createNoteSchema = z.object({
  text: z
    .string()
    .trim()
    .min(1, "Note text is required")
    .max(500, "Note text too long"),
});

export const updateNoteSchema = z.object({
  text: z.string().min(1).max(500).optional(),
});
