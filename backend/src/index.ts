import express, { Application, Request, Response } from "express";
import morgan from "morgan";
import recipeRoutes from "./routes/recipes";
import authRoutes from "./routes/auth";
import userRoutes from "./routes/users";
import dotenv from "dotenv";
import { initDb } from "./database";
import cors from "cors";
import { validJWTProvided } from "./middleware/auth.middleware";

dotenv.config();

const PORT = process.env.PORT || 3001;
const allowedOrigins = (
  process.env.CORS_ORIGINS ||
  "http://localhost:4200,http://localhost:4201,http://localhost:90,https://osd-project-2026-samuel-kocych.onrender.com"
)
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

const app: Application = express();

app.use(morgan("tiny"));
app.use(express.json());

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
  }),
);

app.use("/api/v1/recipes", validJWTProvided, recipeRoutes);
app.use("/api/v1/users", validJWTProvided, userRoutes);
app.use("/api/v1/auth", authRoutes);

app.get("/ping", async (_req: Request, res: Response) => {
  res.json({
    message: "Welcome to my recipe API!",
  });
});

initDb().catch((err) => {
  console.error("Failed to connect to database:", err);
});

export { app };
