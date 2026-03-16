"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const morgan_1 = __importDefault(require("morgan"));
const recipes_1 = __importDefault(require("./routes/recipes"));
const auth_1 = __importDefault(require("./routes/auth"));
const users_1 = __importDefault(require("./routes/users"));
const dotenv_1 = __importDefault(require("dotenv"));
const database_1 = require("./database");
const cors_1 = __importDefault(require("cors"));
const auth_middleware_1 = require("./middleware/auth.middleware");
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
const allowedOrigins = (process.env.CORS_ORIGINS ||
    "http://localhost:4200,http://localhost:4201,https://osd-project-2026-samuel-kocych.onrender.com")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
const app = (0, express_1.default)();
exports.app = app;
app.use((0, morgan_1.default)("tiny"));
app.use(express_1.default.json());
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error("Origin not allowed by CORS"));
    },
    credentials: true,
}));
app.use("/api/v1/recipes", auth_middleware_1.validJWTProvided, recipes_1.default);
app.use("/api/v1/users", auth_middleware_1.validJWTProvided, users_1.default);
app.use("/api/v1/auth", auth_1.default);
app.get("/ping", async (_req, res) => {
    res.json({
        message: "Welcome to my recipe API!",
    });
});
(0, database_1.initDb)().catch((err) => {
    console.error("Failed to connect to database:", err);
});
