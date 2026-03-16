"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRecipesCount = exports.getRandomRecipe = exports.deleteNote = exports.addNote = exports.getNotes = exports.deleteRecipe = exports.updateRecipe = exports.createRecipe = exports.getRecipeById = exports.getRecipes = void 0;
const database_1 = require("../database");
const mongodb_1 = require("mongodb");
const recipe_1 = require("../models/recipe");
const isAdmin = (res) => res.locals?.payload?.role === "admin";
const isEditor = (res) => res.locals?.payload?.role === "editor";
const getUserObjectId = (res) => {
    const userId = res.locals?.payload?.userId;
    if (!userId || typeof userId !== "string")
        return null;
    if (!mongodb_1.ObjectId.isValid(userId))
        return null;
    return new mongodb_1.ObjectId(userId);
};
const canAccessPrivateRecipes = (res) => {
    return isEditor(res) || isAdmin(res);
};
// get all recipes
const getRecipes = async (req, res) => {
    try {
        const userObjectId = getUserObjectId(res);
        if (!userObjectId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!canAccessPrivateRecipes(res)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const { search, ingredient, difficulty, sort, order, page, limit } = req.query;
        const filter = { ownerId: userObjectId };
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
        const sortObj = {};
        if (sort) {
            sortObj[sort] = order === "asc" ? 1 : -1;
        }
        else {
            sortObj["dateCreated"] = -1; // default sort newest first
        }
        // pagination
        const pageNumber = page == null ? 1 : parseInt(page, 10);
        const limitNumber = limit == null ? 10 : parseInt(limit, 10);
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
        const recipes = await database_1.collections.recipes
            ?.find(filter)
            .sort(sortObj)
            .skip(skip)
            .limit(limitNumber)
            .toArray();
        const total = await database_1.collections.recipes?.countDocuments(filter);
        res.status(200).json({ total, page: pageNumber, recipes });
    }
    catch (error) {
        console.error(error);
        res.status(500).send("Failed to fetch recipes.");
    }
};
exports.getRecipes = getRecipes;
// get recipe by id
const getRecipeById = async (req, res) => {
    const id = req.params.id;
    try {
        const userObjectId = getUserObjectId(res);
        if (!userObjectId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!canAccessPrivateRecipes(res)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const query = { _id: new mongodb_1.ObjectId(id) };
        const recipe = (await database_1.collections.recipes?.findOne(query));
        if (!recipe) {
            res.status(404).json({ message: `No recipe found with id ${id}` });
            return;
        }
        res.status(200).send(recipe);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`issue fetching recipe: ${error.message}`);
        }
        else {
            console.error(`error fetching recipe: ${error}`);
        }
        res.status(400).send("Invalid recipe ID format.");
    }
};
exports.getRecipeById = getRecipeById;
// create a new recipe
const createRecipe = async (req, res) => {
    const validation = recipe_1.createRecipeSchema.safeParse(req.body);
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
    const newRecipe = {
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
        const result = await database_1.collections.recipes?.insertOne(newRecipe);
        if (result) {
            res
                .status(201)
                .location(`${result.insertedId}`)
                .json({ message: `Created a new recipe with id ${result.insertedId}` });
        }
        else {
            res.status(500).send("Failed to create a new recipe.");
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`issue creating recipe: ${error.message}`);
        }
        else {
            console.error(`error creating recipe: ${error}`);
        }
        res.status(400).send("Unable to create new recipe");
    }
};
exports.createRecipe = createRecipe;
// update a recipe by id
const updateRecipe = async (req, res) => {
    const id = req.params.id;
    const validation = recipe_1.updateRecipeSchema.safeParse(req.body);
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
        const existing = await database_1.collections.recipes?.findOne({
            _id: new mongodb_1.ObjectId(id),
        });
        if (!existing) {
            return res.status(404).json({ message: "Recipe not found" });
        }
        // build dynamic update object only for provided fields
        const data = validation.data;
        const set = { dateUpdated: new Date() };
        if (data.title !== undefined)
            set.title = data.title;
        if (data.ingredients !== undefined)
            set.ingredients = data.ingredients;
        if (data.instructions !== undefined)
            set.instructions = data.instructions;
        if (data.difficulty !== undefined)
            set.difficulty = data.difficulty;
        if (data.image !== undefined)
            set.image = data.image;
        // notes here managed by note endpoints
        await database_1.collections.recipes?.updateOne({ _id: new mongodb_1.ObjectId(id) }, { $set: set });
        const updatedRecipe = await database_1.collections.recipes?.findOne({
            _id: new mongodb_1.ObjectId(id),
        });
        res.json(updatedRecipe);
    }
    catch (error) {
        if (error instanceof Error) {
            console.error(`issue updating recipe: ${error.message}`);
        }
        else {
            console.error(`error updating recipe: ${error}`);
        }
        res.status(500).json({ message: "Something went wrong" });
    }
};
exports.updateRecipe = updateRecipe;
// delete a recipe by id
const deleteRecipe = async (req, res) => {
    const id = req.params.id;
    try {
        const userObjectId = getUserObjectId(res);
        if (!userObjectId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!canAccessPrivateRecipes(res)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const existing = (await database_1.collections.recipes?.findOne({
            _id: new mongodb_1.ObjectId(id),
        }));
        if (!existing) {
            return res.status(404).json({ message: `Recipe ${id} not found` });
        }
        const result = await database_1.collections.recipes?.deleteOne({
            _id: new mongodb_1.ObjectId(id),
        });
        if (result && result.deletedCount > 0) {
            res.status(200).json({ message: `Recipe ${id} successfully deleted` });
        }
        else {
            res.status(404).json({ message: `Recipe ${id} not found` });
        }
    }
    catch (error) {
        if (error instanceof Error) {
            console.log(`issue deleting recipe: ${error.message}`);
        }
        else {
            console.log(`error deleting recipe: ${error}`);
        }
        res.status(400).send("Unable to delete recipe");
    }
};
exports.deleteRecipe = deleteRecipe;
// get all notes for a recipe
const getNotes = async (req, res) => {
    const recipeId = req.params.recipeId;
    try {
        const userObjectId = getUserObjectId(res);
        if (!userObjectId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!canAccessPrivateRecipes(res)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const recipe = (await database_1.collections.recipes?.findOne({
            _id: new mongodb_1.ObjectId(recipeId),
        }));
        if (!recipe)
            return res.status(404).json({ message: "Recipe not found" });
        res.status(200).json(recipe.notes || []);
    }
    catch (error) {
        if (error instanceof Error)
            console.error(`issue fetching notes: ${error.message}`);
        else
            console.error(`error fetching notes: ${error}`);
        res.status(400).send("Invalid recipe ID format.");
    }
};
exports.getNotes = getNotes;
// add a new note
const addNote = async (req, res) => {
    const recipeId = req.params.recipeId;
    const userObjectId = getUserObjectId(res);
    if (!userObjectId) {
        return res.status(401).json({ message: "Not authenticated" });
    }
    if (!canAccessPrivateRecipes(res)) {
        return res.status(403).json({ message: "Forbidden" });
    }
    const validation = recipe_1.createNoteSchema.safeParse(req.body);
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
    const newNote = {
        _id: new mongodb_1.ObjectId(),
        text,
        date: new Date(),
    };
    try {
        const recipe = (await database_1.collections.recipes?.findOne({
            _id: new mongodb_1.ObjectId(recipeId),
        }));
        if (!recipe)
            return res.status(404).json({ message: "Recipe not found" });
        const result = await database_1.collections.recipes?.updateOne({ _id: new mongodb_1.ObjectId(recipeId) }, {
            $push: { notes: newNote },
        });
        if (!result || result.matchedCount === 0)
            return res.status(404).json({ message: "Recipe not found" });
        res
            .status(201)
            .location(`${newNote._id}`)
            .json({ message: `Created a new note with id ${newNote._id}` });
    }
    catch (error) {
        if (error instanceof Error)
            console.error(`issue adding note: ${error.message}`);
        else
            console.error(`error adding note: ${error}`);
        res.status(400).send("Unable to add note");
    }
};
exports.addNote = addNote;
// delete a note
const deleteNote = async (req, res) => {
    const { recipeId, noteId } = req.params;
    try {
        const userObjectId = getUserObjectId(res);
        if (!userObjectId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!canAccessPrivateRecipes(res)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const recipe = await database_1.collections.recipes?.findOne({
            _id: new mongodb_1.ObjectId(recipeId),
        });
        if (!recipe)
            return res.status(404).json({ message: "Recipe not found" });
        const noteExists = recipe.notes.some((n) => n._id.toString() === noteId);
        if (!noteExists)
            return res.status(404).json({ message: "Note not found" });
        await database_1.collections.recipes?.updateOne({ _id: new mongodb_1.ObjectId(recipeId) }, {
            $pull: { notes: { _id: new mongodb_1.ObjectId(noteId) } },
        });
        res.status(200).json({ message: "Note deleted" });
    }
    catch (error) {
        if (error instanceof Error)
            console.error(`issue deleting note: ${error.message}`);
        else
            console.error(`error deleting note: ${error}`);
        res.status(400).send("Unable to delete note");
    }
};
exports.deleteNote = deleteNote;
// get random recipe
const getRandomRecipe = async (_req, res) => {
    try {
        const userObjectId = getUserObjectId(res);
        if (!userObjectId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!canAccessPrivateRecipes(res)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const filter = { ownerId: userObjectId };
        const count = await database_1.collections.recipes?.countDocuments(filter);
        if (!count || count === 0)
            return res.status(404).json({ message: "No recipes found" });
        const randomIndex = Math.floor(Math.random() * count);
        const randomRecipe = await database_1.collections.recipes
            ?.find(filter)
            .skip(randomIndex)
            .limit(1)
            .toArray();
        res.status(200).json(randomRecipe?.[0]);
    }
    catch (error) {
        console.error("Error fetching random recipe:", error);
        res.status(500).json({ message: "Failed to get random recipe" });
    }
};
exports.getRandomRecipe = getRandomRecipe;
// get total count of recipes
const getRecipesCount = async (_req, res) => {
    try {
        const userObjectId = getUserObjectId(res);
        if (!userObjectId) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!canAccessPrivateRecipes(res)) {
            return res.status(403).json({ message: "Forbidden" });
        }
        const count = await database_1.collections.recipes?.countDocuments({
            ownerId: userObjectId,
        });
        res.status(200).json({ totalRecipes: count || 0 });
    }
    catch (error) {
        console.error("Error fetching recipe count:", error);
        res.status(500).json({ message: "Failed to get recipe count" });
    }
};
exports.getRecipesCount = getRecipesCount;
