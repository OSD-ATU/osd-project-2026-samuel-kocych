import { Request, Response } from "express";
import { collections } from "../database";
import { Recipe, Note } from "../models/recipe";
import { ObjectId } from "mongodb";
import {
  createRecipeSchema,
  updateRecipeSchema,
  createNoteSchema,
} from "../models/recipe";

const isAdmin = (res: Response): boolean =>
  res.locals?.payload?.role === "admin";

const isEditor = (res: Response): boolean =>
  res.locals?.payload?.role === "editor";

const getUserObjectId = (res: Response): ObjectId | null => {
  const userId = res.locals?.payload?.userId;
  if (!userId || typeof userId !== "string") return null;
  if (!ObjectId.isValid(userId)) return null;
  return new ObjectId(userId);
};

const canAccessPrivateRecipes = (res: Response): boolean => {
  return isEditor(res) || isAdmin(res);
};

// get all recipes
export const getRecipes = async (req: Request, res: Response) => {
  try {
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!canAccessPrivateRecipes(res)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { search, ingredient, difficulty, sort, order, page, limit } =
      req.query;

    const filter: any = { ownerId: userObjectId };

    // search by title
    if (search) {
      filter.title = { $regex: search, $options: "i" }; // case-insensitive
    }

    // filter by ingredient
    if (ingredient) {
      filter.ingredients = { $in: [ingredient] };
    }

    // filter by difficulty
    if (difficulty) {
      filter.difficulty = difficulty;
    }

    // sorting
    const sortObj: any = {};
    if (sort) {
      sortObj[sort as string] = order === "asc" ? 1 : -1;
    } else {
      sortObj["dateCreated"] = -1; // default sort newest first
    }

    // pagination
    const pageNumber = page == null ? 1 : parseInt(page as string, 10);
    const limitNumber = limit == null ? 10 : parseInt(limit as string, 10);

    if (Number.isNaN(pageNumber) || Number.isNaN(limitNumber)) {
      return res
        .status(400)
        .json({ message: "Invalid page or limit, must be integers" });
    }

    if (pageNumber < 1 || limitNumber < 1) {
      return res
        .status(400)
        .json({ message: "Invalid page or limit, must be >= 1" });
    }
    const skip = (pageNumber - 1) * limitNumber;

    const recipes = await collections.recipes
      ?.find(filter)
      .sort(sortObj)
      .skip(skip)
      .limit(limitNumber)
      .toArray();

    const total = await collections.recipes?.countDocuments(filter);

    res.status(200).json({ total, page: pageNumber, recipes });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch recipes.");
  }
};

// get recipe by id
export const getRecipeById = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!canAccessPrivateRecipes(res)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const query = { _id: new ObjectId(id) };
    const recipe = (await collections.recipes?.findOne(query)) as Recipe;

    if (!recipe) {
      res.status(404).json({ message: `No recipe found with id ${id}` });
      return;
    }

    res.status(200).send(recipe);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`issue fetching recipe: ${error.message}`);
    } else {
      console.error(`error fetching recipe: ${error}`);
    }
    res.status(400).send("Invalid recipe ID format.");
  }
};

// create a new recipe
export const createRecipe = async (req: Request, res: Response) => {
  const validation = createRecipeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues,
    });
  }
  const userObjectId = getUserObjectId(res);
  if (!userObjectId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  const { title, ingredients, instructions } = validation.data;

  const newRecipe: Recipe = {
    ownerId: userObjectId,
    title,
    ingredients,
    instructions,
    image: validation.data.image,
    notes: [],
    dateCreated: new Date(),
    dateUpdated: new Date(),
    difficulty: validation.data.difficulty,
  };

  try {
    // insert recipe with default dates and notes
    const result = await collections.recipes?.insertOne(newRecipe);

    if (result) {
      res
        .status(201)
        .location(`${result.insertedId}`)
        .json({ message: `Created a new recipe with id ${result.insertedId}` });
    } else {
      res.status(500).send("Failed to create a new recipe.");
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error(`issue creating recipe: ${error.message}`);
    } else {
      console.error(`error creating recipe: ${error}`);
    }
    res.status(400).send("Unable to create new recipe");
  }
};

// update a recipe by id
export const updateRecipe = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  const validation = updateRecipeSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues,
    });
  }

  const userObjectId = getUserObjectId(res);
  if (!userObjectId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!canAccessPrivateRecipes(res)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  try {
    // fetch existing recipe
    const existing = await collections.recipes?.findOne({
      _id: new ObjectId(id),
    });
    if (!existing) {
      return res.status(404).json({ message: "Recipe not found" });
    }

    // build dynamic update object only for provided fields
    const data = validation.data;
    const set: any = { dateUpdated: new Date() };
    if (data.title !== undefined) set.title = data.title;
    if (data.ingredients !== undefined) set.ingredients = data.ingredients;
    if (data.instructions !== undefined) set.instructions = data.instructions;
    if (data.difficulty !== undefined) set.difficulty = data.difficulty;
    if (data.image !== undefined) set.image = data.image;
    // notes here managed by note endpoints

    await collections.recipes?.updateOne(
      { _id: new ObjectId(id) },
      { $set: set },
    );

    const updatedRecipe = await collections.recipes?.findOne({
      _id: new ObjectId(id),
    });
    res.json(updatedRecipe);
  } catch (error) {
    if (error instanceof Error) {
      console.error(`issue updating recipe: ${error.message}`);
    } else {
      console.error(`error updating recipe: ${error}`);
    }
    res.status(500).json({ message: "Something went wrong" });
  }
};

// delete a recipe by id
export const deleteRecipe = async (req: Request, res: Response) => {
  const id = req.params.id as string;

  try {
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!canAccessPrivateRecipes(res)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const existing = (await collections.recipes?.findOne({
      _id: new ObjectId(id),
    })) as Recipe | null;

    if (!existing) {
      return res.status(404).json({ message: `Recipe ${id} not found` });
    }

    const result = await collections.recipes?.deleteOne({
      _id: new ObjectId(id),
    });

    if (result && result.deletedCount > 0) {
      res.status(200).json({ message: `Recipe ${id} successfully deleted` });
    } else {
      res.status(404).json({ message: `Recipe ${id} not found` });
    }
  } catch (error) {
    if (error instanceof Error) {
      console.log(`issue deleting recipe: ${error.message}`);
    } else {
      console.log(`error deleting recipe: ${error}`);
    }
    res.status(400).send("Unable to delete recipe");
  }
};

// get all notes for a recipe
export const getNotes = async (req: Request, res: Response) => {
  const recipeId = req.params.recipeId as string;
  try {
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!canAccessPrivateRecipes(res)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const recipe = (await collections.recipes?.findOne({
      _id: new ObjectId(recipeId),
    })) as Recipe;
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    res.status(200).json(recipe.notes || []);
  } catch (error) {
    if (error instanceof Error)
      console.error(`issue fetching notes: ${error.message}`);
    else console.error(`error fetching notes: ${error}`);
    res.status(400).send("Invalid recipe ID format.");
  }
};

// add a new note
export const addNote = async (req: Request, res: Response) => {
  const recipeId = req.params.recipeId as string;

  const userObjectId = getUserObjectId(res);
  if (!userObjectId) {
    return res.status(401).json({ message: "Not authenticated" });
  }

  if (!canAccessPrivateRecipes(res)) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const validation = createNoteSchema.safeParse(req.body);
  if (!validation.success) {
    return res.status(400).json({
      message: "Validation failed",
      errors: validation.error.issues,
    });
  }

  const { text } = validation.data;

  if (!text) {
    return res
      .status(400)
      .json({ message: "Missing required fields for note" });
  }

  const newNote: Note = {
    _id: new ObjectId(),
    text,
    date: new Date(),
  };

  try {
    const recipe = (await collections.recipes?.findOne({
      _id: new ObjectId(recipeId),
    })) as Recipe | null;

    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const result = await collections.recipes?.updateOne(
      { _id: new ObjectId(recipeId) },
      {
        $push: { notes: newNote },
      },
    );

    if (!result || result.matchedCount === 0)
      return res.status(404).json({ message: "Recipe not found" });

    res
      .status(201)
      .location(`${newNote._id}`)
      .json({ message: `Created a new note with id ${newNote._id}` });
  } catch (error) {
    if (error instanceof Error)
      console.error(`issue adding note: ${error.message}`);
    else console.error(`error adding note: ${error}`);
    res.status(400).send("Unable to add note");
  }
};

// delete a note
export const deleteNote = async (req: Request, res: Response) => {
  const { recipeId, noteId } = req.params as {
    recipeId: string;
    noteId: string;
  };
  try {
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!canAccessPrivateRecipes(res)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const recipe = await collections.recipes?.findOne({
      _id: new ObjectId(recipeId),
    });
    if (!recipe) return res.status(404).json({ message: "Recipe not found" });

    const noteExists = recipe.notes.some(
      (n) => (n._id as ObjectId).toString() === noteId,
    );

    if (!noteExists) return res.status(404).json({ message: "Note not found" });

    await collections.recipes?.updateOne(
      { _id: new ObjectId(recipeId) },
      {
        $pull: { notes: { _id: new ObjectId(noteId) } },
      },
    );

    res.status(200).json({ message: "Note deleted" });
  } catch (error) {
    if (error instanceof Error)
      console.error(`issue deleting note: ${error.message}`);
    else console.error(`error deleting note: ${error}`);
    res.status(400).send("Unable to delete note");
  }
};

// get random recipe
export const getRandomRecipe = async (_req: Request, res: Response) => {
  try {
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!canAccessPrivateRecipes(res)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const filter = { ownerId: userObjectId };

    const count = await collections.recipes?.countDocuments(filter);
    if (!count || count === 0)
      return res.status(404).json({ message: "No recipes found" });

    const randomIndex = Math.floor(Math.random() * count);
    const randomRecipe = await collections.recipes
      ?.find(filter)
      .skip(randomIndex)
      .limit(1)
      .toArray();

    res.status(200).json(randomRecipe?.[0]);
  } catch (error) {
    console.error("Error fetching random recipe:", error);
    res.status(500).json({ message: "Failed to get random recipe" });
  }
};

// get total count of recipes
export const getRecipesCount = async (_req: Request, res: Response) => {
  try {
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    if (!canAccessPrivateRecipes(res)) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const count = await collections.recipes?.countDocuments({
      ownerId: userObjectId,
    });
    res.status(200).json({ totalRecipes: count || 0 });
  } catch (error) {
    console.error("Error fetching recipe count:", error);
    res.status(500).json({ message: "Failed to get recipe count" });
  }
};
