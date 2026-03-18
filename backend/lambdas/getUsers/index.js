const { MongoClient } = require("mongodb");

const MONGODB_URI =
  "mongodb+srv://skocych:49uEe51zHnphu6vx@cluster0.wnjfr.mongodb.net/";
const DB_NAME = "recipe-app";

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;
  const client = await MongoClient.connect(MONGODB_URI);
  const db = client.db(DB_NAME);
  cachedDb = db;
  return db;
}

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type,Authorization",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,DELETE,OPTIONS",
};

exports.handler = async (event, context) => {
  context.callbackWaitsForEmptyEventLoop = false;

  if (event.httpMethod === "OPTIONS") {
    return {
      statusCode: 204,
      headers: corsHeaders,
      body: null,
    };
  }

  try {
    const db = await connectToDatabase();
    const users = await db.collection("users").find({}).toArray();
    const sanitizedUsers = users.map(({ password, ...rest }) => rest);

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({ users: sanitizedUsers }),
    };
  } catch (err) {
    console.error("Error fetching users:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Failed to fetch users" }),
    };
  }
};
