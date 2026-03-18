const { MongoClient, ObjectId } = require("mongodb");

const MONGODB_URI = process.env.DB_CONN_STRING || "";
const DB_NAME = process.env.DB_NAME || "recipe-app";

let cachedDb = null;

async function connectToDatabase() {
  if (cachedDb) return cachedDb;

  if (!MONGODB_URI) {
    throw new Error("Missing DB_CONN_STRING environment variable");
  }

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
    const userId = event.pathParameters?.userId;
    const { role } = JSON.parse(event.body || "{}");

    if (!userId || !ObjectId.isValid(userId)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Invalid user ID" }),
      };
    }

    const validRoles = ["admin", "editor", ""];
    if (typeof role !== "string" || !validRoles.includes(role)) {
      return {
        statusCode: 400,
        headers: corsHeaders,
        body: JSON.stringify({ message: "Invalid role" }),
      };
    }

    const db = await connectToDatabase();
    const result = await db
      .collection("users")
      .updateOne({ _id: new ObjectId(userId) }, { $set: { role } });

    if (!result.matchedCount) {
      return {
        statusCode: 404,
        headers: corsHeaders,
        body: JSON.stringify({ message: "User not found" }),
      };
    }

    return {
      statusCode: 200,
      headers: corsHeaders,
      body: JSON.stringify({
        message: "Role updated successfully",
        userId,
        role,
      }),
    };
  } catch (err) {
    console.error("Error updating user role:", err);
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({ message: "Failed to update role" }),
    };
  }
};
