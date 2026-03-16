"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const users_1 = require("../controllers/users");
const router = express_1.default.Router();
router.get("/me/favorites", users_1.getMyFavorites);
router.post("/me/favorites", users_1.addMyFavorite);
router.delete("/me/favorites/:source/:id", users_1.deleteMyFavorite);
router.get("/me/profile", users_1.getMyProfile);
router.put("/me/profile", users_1.updateMyProfile);
router.delete("/me/profile", users_1.deleteMyAccount);
exports.default = router;
