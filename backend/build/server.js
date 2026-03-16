"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("./src/index");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const PORT = process.env.PORT || 3001;
index_1.app.listen(PORT, (error) => {
    if (error) {
        if (error instanceof Error) {
            console.error("Error starting server:", error.message);
        }
        else {
            console.error("Error starting server:", error);
        }
        process.exit(1); // Exit the process with an error code
    }
    else {
        console.log("Server is running on port", PORT);
    }
});
