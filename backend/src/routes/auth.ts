import express, { Router } from "express";
import { createUserSchema } from "../models/user";
import { validate } from "../middleware/validate.middleware";
import { registerUser, loginUser } from "../controllers/auth";
import rateLimit from "express-rate-limit";

const router: Router = express.Router();

// rate limiting for login to prevent brute-force attacks
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each IP to 50 login attempts per window
  message: "Too many login attempts. Try again later.",
});

router.post("/register", validate(createUserSchema), registerUser);
router.post("/login", loginLimiter, loginUser);

export default router;
