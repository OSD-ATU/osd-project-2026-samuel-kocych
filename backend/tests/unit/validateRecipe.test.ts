import {
  createRecipeSchema,
  updateRecipeSchema,
  createNoteSchema,
  updateNoteSchema,
} from "../../src/models/recipe";

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
    expect(() => createRecipeSchema.parse(validRecipe)).not.toThrow();
  });

  it("should fail createRecipeSchema with empty title", () => {
    expect(() =>
      createRecipeSchema.parse({ ...validRecipe, title: "" }),
    ).toThrow();
  });

  it("should fail createRecipeSchema with invalid difficulty", () => {
    expect(() =>
      createRecipeSchema.parse({ ...validRecipe, difficulty: "super-hard" }),
    ).toThrow();
  });

  it("should pass updateRecipeSchema with partial data", () => {
    const updateData = { title: "Updated Title" };
    expect(() => updateRecipeSchema.parse(updateData)).not.toThrow();
  });
});

describe("Note Validation", () => {
  it("should pass createNoteSchema with valid data", () => {
    expect(() => createNoteSchema.parse(validNote)).not.toThrow();
  });

  it("should fail createNoteSchema with missing text", () => {
    expect(() => createNoteSchema.parse({ ...validNote, text: "" })).toThrow();
  });

  it("should pass updateNoteSchema with partial data", () => {
    const updateData = { text: "Updated note" };
    expect(() => updateNoteSchema.parse(updateData)).not.toThrow();
  });
});
