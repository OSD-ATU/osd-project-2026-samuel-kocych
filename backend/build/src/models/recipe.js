"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateNoteSchema = exports.createNoteSchema = exports.updateRecipeSchema = exports.createRecipeSchema = void 0;
const zod_1 = require("zod");
// validation schemas using zod
// recipe schemas
exports.createRecipeSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, "Title is required").max(200, "Title too long"),
    ingredients: zod_1.z
        .array(zod_1.z.string())
        .min(1, "At least one ingredient is required")
        .max(50, "Too many ingredients"),
    instructions: zod_1.z
        .string()
        .min(1, "Instructions are required")
        .max(5000, "Instructions too long"),
    difficulty: zod_1.z.enum(["easy", "medium", "hard"]).optional().default("medium"),
    image: zod_1.z.string().trim().url("Image must be a valid URL").optional(),
});
exports.updateRecipeSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(1, "Title cannot be empty")
        .max(200, "Title too long")
        .optional(),
    ingredients: zod_1.z
        .array(zod_1.z.string())
        .min(1, "Ingredients cannot be empty")
        .max(50, "Too many ingredients")
        .optional(),
    instructions: zod_1.z
        .string()
        .min(1, "Instructions cannot be empty")
        .max(5000, "Instructions too long")
        .optional(),
    difficulty: zod_1.z.enum(["easy", "medium", "hard"]).optional(),
    image: zod_1.z.string().trim().url("Image must be a valid URL").optional(),
});
// note schemas
exports.createNoteSchema = zod_1.z.object({
    text: zod_1.z
        .string()
        .trim()
        .min(1, "Note text is required")
        .max(500, "Note text too long"),
});
exports.updateNoteSchema = zod_1.z.object({
    text: zod_1.z.string().min(1).max(500).optional(),
});
