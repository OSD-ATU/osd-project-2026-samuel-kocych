"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const recipe_1 = require("../../src/models/recipe");
const validRecipe = {
    title: "Pancakes",
    ingredients: ["egg", "milk", "flour"],
    instructions: "Mix ingredients and cook on pan.",
    difficulty: "easy",
};
const validNote = {
    text: "Great recipe!",
};
describe("Recipe Validation", () => {
    it("should pass createRecipeSchema with valid data", () => {
        expect(() => recipe_1.createRecipeSchema.parse(validRecipe)).not.toThrow();
    });
    it("should fail createRecipeSchema with empty title", () => {
        expect(() => recipe_1.createRecipeSchema.parse({ ...validRecipe, title: "" })).toThrow();
    });
    it("should fail createRecipeSchema with invalid difficulty", () => {
        expect(() => recipe_1.createRecipeSchema.parse({ ...validRecipe, difficulty: "super-hard" })).toThrow();
    });
    it("should pass updateRecipeSchema with partial data", () => {
        const updateData = { title: "Updated Title" };
        expect(() => recipe_1.updateRecipeSchema.parse(updateData)).not.toThrow();
    });
});
describe("Note Validation", () => {
    it("should pass createNoteSchema with valid data", () => {
        expect(() => recipe_1.createNoteSchema.parse(validNote)).not.toThrow();
    });
    it("should fail createNoteSchema with missing text", () => {
        expect(() => recipe_1.createNoteSchema.parse({ ...validNote, text: "" })).toThrow();
    });
    it("should pass updateNoteSchema with partial data", () => {
        const updateData = { text: "Updated note" };
        expect(() => recipe_1.updateNoteSchema.parse(updateData)).not.toThrow();
    });
});
