import express, { Router } from "express";
import {
  getRecipes,
  getRecipeById,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  getNotes,
  addNote,
  deleteNote,
  getRandomRecipe,
  getRecipesCount,
} from "../controllers/recipes";
import { validate } from "../middleware/validate.middleware";
import {
  createRecipeSchema,
  updateRecipeSchema,
  createNoteSchema,
} from "../models/recipe";
import { requireRole } from "../middleware/auth.middleware";

const router: Router = express.Router();

// recipe endpoints
router.get("/random", requireRole(["editor", "admin"]), getRandomRecipe);
router.get("/count", requireRole(["editor", "admin"]), getRecipesCount);
router.get("/", requireRole(["editor", "admin"]), getRecipes);
router.get("/:id", requireRole(["editor", "admin"]), getRecipeById);
router.post(
  "/",
  validate(createRecipeSchema),
  requireRole(["editor", "admin"]),
  createRecipe,
);
router.put(
  "/:id",
  validate(updateRecipeSchema),
  requireRole(["editor", "admin"]),
  updateRecipe,
);
router.delete("/:id", requireRole(["editor", "admin"]), deleteRecipe);

// note endpoints
router.get("/:recipeId/notes", requireRole(["editor", "admin"]), getNotes);
router.post(
  "/:recipeId/notes",
  validate(createNoteSchema),
  requireRole(["editor", "admin"]),
  addNote,
);
router.delete(
  "/:recipeId/notes/:noteId",
  requireRole(["editor", "admin"]),
  deleteNote,
);
export default router;
