"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteMyAccount = exports.updateMyProfile = exports.getMyProfile = exports.deleteMyFavorite = exports.addMyFavorite = exports.getMyFavorites = void 0;
const mongodb_1 = require("mongodb");
const database_1 = require("../database");
const argon2 = __importStar(require("argon2"));
const getCurrentUser = async (res) => {
    const userId = res.locals?.payload?.userId;
    const email = res.locals?.payload?.email;
    if (typeof userId === "string" && mongodb_1.ObjectId.isValid(userId)) {
        const user = await database_1.collections.users?.findOne({
            _id: new mongodb_1.ObjectId(userId),
        });
        if (user)
            return user;
    }
    if (typeof email === "string") {
        const user = await database_1.collections.users?.findOne({
            email: email.toLowerCase(),
        });
        if (user)
            return user;
    }
    return null;
};
const normalizeFavorites = (favorites) => {
    if (!Array.isArray(favorites))
        return [];
    return favorites.filter((item) => item?.id && item?.source);
};
const getFavoritePathParams = (req) => {
    const source = req.params.source;
    const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
    return { source, id };
};
const getMyFavorites = async (_req, res) => {
    try {
        const user = await getCurrentUser(res);
        if (!user?._id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        return res.status(200).json({ items: normalizeFavorites(user.favorites) });
    }
    catch (error) {
        console.error("Error fetching favorites:", error);
        return res.status(500).json({ message: "Failed to fetch favorites" });
    }
};
exports.getMyFavorites = getMyFavorites;
const addMyFavorite = async (req, res) => {
    try {
        const user = await getCurrentUser(res);
        if (!user?._id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
        const source = req.body?.source;
        const image = typeof req.body?.image === "string" ? req.body.image.trim() : "";
        if (!id || (source !== "internal" && source !== "external")) {
            return res.status(400).json({ message: "Invalid favorite payload" });
        }
        const role = res.locals?.payload?.role;
        const canUseInternalFavorites = role === "editor" || role === "admin";
        if (source === "internal" && !canUseInternalFavorites) {
            return res.status(403).json({
                message: "Users can only add external favorites",
            });
        }
        if (source === "internal") {
            if (!mongodb_1.ObjectId.isValid(id)) {
                return res.status(400).json({ message: "Invalid internal recipe id" });
            }
            const recipe = (await database_1.collections.recipes?.findOne({
                _id: new mongodb_1.ObjectId(id),
            }));
            if (!recipe)
                return res.status(404).json({ message: "Recipe not found" });
        }
        const favorites = normalizeFavorites(user.favorites);
        const existingIndex = favorites.findIndex((item) => item.id === id && item.source === source);
        if (existingIndex >= 0) {
            if (image && !favorites[existingIndex].image) {
                favorites[existingIndex] = { ...favorites[existingIndex], image };
            }
        }
        else {
            favorites.push({
                id,
                source,
                image: image || undefined,
                addedAt: new Date(),
            });
        }
        await database_1.collections.users?.updateOne({ _id: user._id }, { $set: { favorites } });
        return res.status(200).json({ items: favorites });
    }
    catch (error) {
        console.error("Error adding favorite:", error);
        return res.status(500).json({ message: "Failed to add favorite" });
    }
};
exports.addMyFavorite = addMyFavorite;
const deleteMyFavorite = async (req, res) => {
    try {
        const user = await getCurrentUser(res);
        if (!user?._id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const { source, id } = getFavoritePathParams(req);
        if (!id || (source !== "internal" && source !== "external")) {
            return res.status(400).json({ message: "Invalid favorite path params" });
        }
        const nextFavorites = normalizeFavorites(user.favorites).filter((item) => !(item.id === id && item.source === source));
        await database_1.collections.users?.updateOne({ _id: user._id }, { $set: { favorites: nextFavorites } });
        return res.status(200).json({ items: nextFavorites });
    }
    catch (error) {
        console.error("Error deleting favorite:", error);
        return res.status(500).json({ message: "Failed to delete favorite" });
    }
};
exports.deleteMyFavorite = deleteMyFavorite;
const getMyProfile = async (_req, res) => {
    try {
        const user = await getCurrentUser(res);
        if (!user?._id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        // Do not send password hash
        const { _id, name, email, dateJoined, role } = user;
        return res.status(200).json({ _id, name, email, dateJoined, role });
    }
    catch (error) {
        console.error("Error fetching profile:", error);
        return res.status(500).json({ message: "Failed to fetch profile" });
    }
};
exports.getMyProfile = getMyProfile;
const updateMyProfile = async (req, res) => {
    try {
        const user = await getCurrentUser(res);
        if (!user?._id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        const { name, email, password, currentPassword } = req.body;
        const updateFields = {};
        if (name)
            updateFields.name = name;
        if (email)
            updateFields.email = email.toLowerCase();
        if (password) {
            updateFields.password = await argon2.hash(password, {
                type: argon2.argon2id,
            });
        }
        if (Object.keys(updateFields).length === 0) {
            return res.status(400).json({ message: "No valid fields to update" });
        }
        await database_1.collections.users?.updateOne({ _id: user._id }, { $set: updateFields });
        return res.status(200).json({ message: "Profile updated" });
    }
    catch (error) {
        console.error("Error updating profile:", error);
        return res.status(500).json({ message: "Failed to update profile" });
    }
};
exports.updateMyProfile = updateMyProfile;
const deleteMyAccount = async (_req, res) => {
    try {
        const user = await getCurrentUser(res);
        if (!user?._id) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        await database_1.collections.users?.deleteOne({ _id: user._id });
        return res.status(200).json({ message: "Account deleted" });
    }
    catch (error) {
        console.error("Error deleting account:", error);
        return res.status(500).json({ message: "Failed to delete account" });
    }
};
exports.deleteMyAccount = deleteMyAccount;
