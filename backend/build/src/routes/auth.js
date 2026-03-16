"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const user_1 = require("../models/user");
const validate_middleware_1 = require("../middleware/validate.middleware");
const auth_1 = require("../controllers/auth");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const router = express_1.default.Router();
// rate limiting for login to prevent brute-force attacks
const loginLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // limit each IP to 50 login attempts per window
    message: "Too many login attempts. Try again later.",
});
router.post("/register", (0, validate_middleware_1.validate)(user_1.createUserSchema), auth_1.registerUser);
router.post("/login", loginLimiter, auth_1.loginUser);
exports.default = router;
