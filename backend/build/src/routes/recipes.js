"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const recipes_1 = require("../controllers/recipes");
const validate_middleware_1 = require("../middleware/validate.middleware");
const recipe_1 = require("../models/recipe");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = express_1.default.Router();
// recipe endpoints
router.get("/random", (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.getRandomRecipe);
router.get("/count", (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.getRecipesCount);
router.get("/", (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.getRecipes);
router.get("/:id", (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.getRecipeById);
router.post("/", (0, validate_middleware_1.validate)(recipe_1.createRecipeSchema), (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.createRecipe);
router.put("/:id", (0, validate_middleware_1.validate)(recipe_1.updateRecipeSchema), (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.updateRecipe);
router.delete("/:id", (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.deleteRecipe);
// note endpoints
router.get("/:recipeId/notes", (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.getNotes);
router.post("/:recipeId/notes", (0, validate_middleware_1.validate)(recipe_1.createNoteSchema), (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.addNote);
router.delete("/:recipeId/notes/:noteId", (0, auth_middleware_1.requireRole)(["editor", "admin"]), recipes_1.deleteNote);
exports.default = router;
