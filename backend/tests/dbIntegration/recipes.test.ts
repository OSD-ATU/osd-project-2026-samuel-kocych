import request from "supertest";
import { app } from "../../src/index";

describe("Recipe API Integration Tests", () => {
  let adminToken: string;
  let editorToken: string;
  let userToken: string;
  let recipeId: string;
  let editorRecipeId: string;
  let noteId: string;

  const validRecipe = {
    title: "Banana Cake",
    ingredients: ["banana", "flour"],
    instructions: "Mix and bake",
    difficulty: "medium",
  };

  const updatedRecipe = {
    title: "Updated Recipe",
    instructions: "Updated instructions",
    difficulty: "easy",
  };

  const validNote = {
    text: "Great recipe note!",
  };

  beforeAll(async () => {
    // register and login admin
    await request(app).post("/api/v1/auth/register").send({
      name: "admin user",
      email: "admin@example.com",
      password: "password",
      role: "admin",
    });
    const adminRes = await request(app).post("/api/v1/auth/login").send({
      email: "admin@example.com",
      password: "password",
    });
    adminToken = adminRes.body.token;

    // register and login editor
    await request(app).post("/api/v1/auth/register").send({
      name: "editor user",
      email: "editor@example.com",
      password: "password",
      role: "editor",
    });
    const editorRes = await request(app).post("/api/v1/auth/login").send({
      email: "editor@example.com",
      password: "password",
    });
    editorToken = editorRes.body.token;

    // register and login normal user
    await request(app).post("/api/v1/auth/register").send({
      name: "normal user",
      email: "user@example.com",
      password: "password",
      role: "user",
    });
    const userRes = await request(app).post("/api/v1/auth/login").send({
      email: "user@example.com",
      password: "password",
    });
    userToken = userRes.body.token;
  });

  // ---- recipe tests ----
  test("admin should create a recipe", async () => {
    const res = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validRecipe)
      .expect(201);

    recipeId = res.header["location"];
    expect(recipeId).toBeDefined();
  });

  test("editor should create a recipe", async () => {
    const res = await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${editorToken}`)
      .send(validRecipe)
      .expect(201);

    editorRecipeId = res.header["location"];
    expect(editorRecipeId).toBeDefined();
  });

  test("user should NOT create a recipe", async () => {
    await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${userToken}`)
      .send(validRecipe)
      .expect(403);
  });

  test("should get all recipes", async () => {
    const res = await request(app)
      .get("/api/v1/recipes")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should get recipe by id", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.title).toBe(validRecipe.title);
  });

  test("editor should update own recipe", async () => {
    const res = await request(app)
      .put(`/api/v1/recipes/${editorRecipeId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send(updatedRecipe)
      .expect(200);
    expect(res.body.title).toBe(updatedRecipe.title);
  });

  test("editor should NOT get admin private recipe", async () => {
    await request(app)
      .get(`/api/v1/recipes/${recipeId}`)
      .set("Authorization", `Bearer ${editorToken}`)
      .expect(403);
  });

  test("admin should NOT get editor private recipe", async () => {
    await request(app)
      .get(`/api/v1/recipes/${editorRecipeId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(403);
  });

  test("list should return only owner recipes", async () => {
    const adminList = await request(app)
      .get("/api/v1/recipes")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const editorList = await request(app)
      .get("/api/v1/recipes")
      .set("Authorization", `Bearer ${editorToken}`)
      .expect(200);

    const adminIds = adminList.body.recipes.map((r: any) => String(r._id));
    const editorIds = editorList.body.recipes.map((r: any) => String(r._id));

    expect(adminIds).toContain(String(recipeId));
    expect(adminIds).not.toContain(String(editorRecipeId));

    expect(editorIds).toContain(String(editorRecipeId));
    expect(editorIds).not.toContain(String(recipeId));

    const userList = await request(app)
      .get("/api/v1/recipes")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);
    const userIds = userList.body.recipes.map((r: any) => String(r._id));
    expect(userIds).not.toContain(String(recipeId));
    expect(userIds).not.toContain(String(editorRecipeId));
  });

  test("favorites should be visible only for current user", async () => {
    await request(app)
      .post("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ id: recipeId, source: "internal" })
      .expect(200);

    await request(app)
      .post("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ id: recipeId, source: "internal" })
      .expect(403);

    await request(app)
      .post("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ id: editorRecipeId, source: "internal" })
      .expect(200);

    const adminFavorites = await request(app)
      .get("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);

    const editorFavorites = await request(app)
      .get("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${editorToken}`)
      .expect(200);

    const adminFavoriteIds = adminFavorites.body.items.map((f: any) => f.id);
    const editorFavoriteIds = editorFavorites.body.items.map((f: any) => f.id);

    expect(adminFavoriteIds).toContain(String(recipeId));
    expect(adminFavoriteIds).not.toContain(String(editorRecipeId));

    expect(editorFavoriteIds).toContain(String(editorRecipeId));
    expect(editorFavoriteIds).not.toContain(String(recipeId));
  });

  test("user can add only external favorites", async () => {
    await request(app)
      .post("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({ id: recipeId, source: "internal" })
      .expect(403);

    await request(app)
      .post("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        id: "ext-123",
        source: "external",
        image: "https://example.com/img.jpg",
      })
      .expect(200);

    const userFavorites = await request(app)
      .get("/api/v1/users/me/favorites")
      .set("Authorization", `Bearer ${userToken}`)
      .expect(200);

    expect(
      userFavorites.body.items.some(
        (item: any) => item.id === "ext-123" && item.source === "external",
      ),
    ).toBe(true);
    expect(
      userFavorites.body.items.some((item: any) => item.source === "internal"),
    ).toBe(false);
  });

  // ---- note tests ----
  test("admin should add note", async () => {
    const res = await request(app)
      .post(`/api/v1/recipes/${recipeId}/notes`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send(validNote)
      .expect(201);

    noteId = res.header["location"];
    expect(noteId).toBeDefined();
  });

  test("editor should NOT add note to admin private recipe", async () => {
    await request(app)
      .post(`/api/v1/recipes/${recipeId}/notes`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send(validNote)
      .expect(403);
  });

  test("should get all notes", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/${recipeId}/notes`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // remove update note test because API does not support it

  test("should delete note", async () => {
    const res = await request(app)
      .delete(`/api/v1/recipes/${recipeId}/notes/${noteId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.message).toBe("Note deleted");
  });

  // ---- advanced queries ----
  test("should search recipes by title", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?search=banana`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should filter recipes by ingredient", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?ingredient=flour`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should sort recipes asc", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?sort=dateCreated&order=asc`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should sort recipes desc", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?sort=dateCreated&order=desc`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(Array.isArray(res.body.recipes)).toBe(true);
  });

  test("should paginate recipes", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes?page=1&limit=10`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.page).toBe(1);
  });

  test("should get random recipe", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/random`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body).toBeDefined();
  });

  test("should get total recipe count", async () => {
    const res = await request(app)
      .get(`/api/v1/recipes/count`)
      .set("Authorization", `Bearer ${adminToken}`)
      .expect(200);
    expect(res.body.totalRecipes).toBeGreaterThanOrEqual(1);
  });

  // ---- failure cases ----
  test("should fail to create recipe with empty title", async () => {
    await request(app)
      .post("/api/v1/recipes")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ ...validRecipe, title: "" })
      .expect(400);
  });

  test("should fail to add note with empty text", async () => {
    await request(app)
      .post(`/api/v1/recipes/${recipeId}/notes`)
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ ...validNote, text: "" })
      .expect(400);
  });

  test("should fail to update non-existent recipe", async () => {
    await request(app)
      .put("/api/v1/recipes/64b64c4f0000000000000000")
      .set("Authorization", `Bearer ${editorToken}`)
      .send({ title: "does not exist" })
      .expect(404);
  });

  test("should fail to delete non-existent recipe as editor", async () => {
    await request(app)
      .delete("/api/v1/recipes/64b64c4f0000000000000000")
      .set("Authorization", `Bearer ${editorToken}`)
      .expect(404);
  });
});
