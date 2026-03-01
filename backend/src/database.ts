import { MongoClient, Db, Collection } from "mongodb";
import dotenv from "dotenv";
import { Recipe } from "./models/recipe";
import { User } from "./models/user";

dotenv.config();

const connectionString: string = process.env.DB_CONN_STRING || "";
const dbName: string = process.env.DB_NAME || "recipe-app";
const client = new MongoClient(connectionString);

export const collections: {
  recipes?: Collection<Recipe>;
  users?: Collection<User>;
} = {};

if (connectionString == "") {
  throw new Error("No connection string in .env file");
}

let db: Db;

export async function initDb(): Promise<void> {
  try {
    await client.connect();
    db = client.db(dbName);
    const recipesCollection: Collection<Recipe> =
      db.collection<Recipe>("recipes");
    const usersCollection: Collection<User> = db.collection<User>("users");
    collections.recipes = recipesCollection;
    collections.users = usersCollection;

    console.log("connected to database");
  } catch (error) {
    if (error instanceof Error) {
      console.log(`issue with db connection ${error.message}`);
    } else {
      console.log(`error with ${error}`);
    }
    throw error;
  }
}

export async function closeDb(): Promise<void> {
  await client.close();
  console.log("Database connection closed");
}
