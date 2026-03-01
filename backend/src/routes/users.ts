import express, { Router } from "express";
import { requireRole } from "../middleware/auth.middleware";
import {
  getMyFavorites,
  addMyFavorite,
  deleteMyFavorite,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
  getAllUsers,
  updateUserRole,
  deleteUser,
} from "../controllers/users";

const router: Router = express.Router();

router.get("/me/favorites", getMyFavorites);
router.post("/me/favorites", addMyFavorite);
router.delete("/me/favorites/:source/:id", deleteMyFavorite);
router.get("/me/profile", getMyProfile);
router.put("/me/profile", updateMyProfile);
router.delete("/me/profile", deleteMyAccount);

// admin role only
router.get("/admin/users", requireRole(["admin"]), getAllUsers);
router.put("/admin/users/:userId/role", requireRole(["admin"]), updateUserRole);
router.delete("/admin/users/:userId", requireRole(["admin"]), deleteUser);

export default router;
