import express, { Router } from "express";
import {
  getMyFavorites,
  addMyFavorite,
  deleteMyFavorite,
  getMyProfile,
  updateMyProfile,
  deleteMyAccount,
} from "../controllers/users";

const router: Router = express.Router();

router.get("/me/favorites", getMyFavorites);
router.post("/me/favorites", addMyFavorite);
router.delete("/me/favorites/:source/:id", deleteMyFavorite);
router.get("/me/profile", getMyProfile);
router.put("/me/profile", updateMyProfile);
router.delete("/me/profile", deleteMyAccount);

export default router;
