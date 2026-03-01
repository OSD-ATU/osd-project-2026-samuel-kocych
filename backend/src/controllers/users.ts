import { Request, Response } from "express";
import { ObjectId } from "mongodb";
import { collections } from "../database";
import { FavoriteItem, User } from "../models/user";
import { Recipe } from "../models/recipe";
import * as argon2 from "argon2";

const getCurrentUser = async (res: Response): Promise<User | null> => {
  const userId = res.locals?.payload?.userId;
  const email = res.locals?.payload?.email;

  if (typeof userId === "string" && ObjectId.isValid(userId)) {
    const user = await collections.users?.findOne({
      _id: new ObjectId(userId),
    });
    if (user) return user as User;
  }

  if (typeof email === "string") {
    const user = await collections.users?.findOne({
      email: email.toLowerCase(),
    });
    if (user) return user as User;
  }

  return null;
};

const normalizeFavorites = (favorites?: FavoriteItem[]): FavoriteItem[] => {
  if (!Array.isArray(favorites)) return [];
  return favorites.filter((item) => item?.id && item?.source);
};

const getFavoritePathParams = (req: Request) => {
  const source = req.params.source;
  const id = typeof req.params.id === "string" ? req.params.id.trim() : "";
  return { source, id };
};

export const getMyFavorites = async (_req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(res);
    if (!user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    return res.status(200).json({ items: normalizeFavorites(user.favorites) });
  } catch (error) {
    console.error("Error fetching favorites:", error);
    return res.status(500).json({ message: "Failed to fetch favorites" });
  }
};

export const addMyFavorite = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(res);
    if (!user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const id = typeof req.body?.id === "string" ? req.body.id.trim() : "";
    const source = req.body?.source;
    const image =
      typeof req.body?.image === "string" ? req.body.image.trim() : "";

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
      if (!ObjectId.isValid(id)) {
        return res.status(400).json({ message: "Invalid internal recipe id" });
      }

      const recipe = (await collections.recipes?.findOne({
        _id: new ObjectId(id),
      })) as Recipe | null;

      if (!recipe) return res.status(404).json({ message: "Recipe not found" });
    }

    const favorites = normalizeFavorites(user.favorites);
    const existingIndex = favorites.findIndex(
      (item) => item.id === id && item.source === source,
    );

    if (existingIndex >= 0) {
      if (image && !favorites[existingIndex].image) {
        favorites[existingIndex] = { ...favorites[existingIndex], image };
      }
    } else {
      favorites.push({
        id,
        source,
        image: image || undefined,
        addedAt: new Date(),
      });
    }

    await collections.users?.updateOne(
      { _id: user._id },
      { $set: { favorites } },
    );

    return res.status(200).json({ items: favorites });
  } catch (error) {
    console.error("Error adding favorite:", error);
    return res.status(500).json({ message: "Failed to add favorite" });
  }
};

export const deleteMyFavorite = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(res);
    if (!user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { source, id } = getFavoritePathParams(req);

    if (!id || (source !== "internal" && source !== "external")) {
      return res.status(400).json({ message: "Invalid favorite path params" });
    }

    const nextFavorites = normalizeFavorites(user.favorites).filter(
      (item) => !(item.id === id && item.source === source),
    );

    await collections.users?.updateOne(
      { _id: user._id },
      { $set: { favorites: nextFavorites } },
    );

    return res.status(200).json({ items: nextFavorites });
  } catch (error) {
    console.error("Error deleting favorite:", error);
    return res.status(500).json({ message: "Failed to delete favorite" });
  }
};

export const getMyProfile = async (_req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(res);
    if (!user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    // Do not send password hash
    const { _id, name, email, dateJoined, role } = user;
    return res.status(200).json({ _id, name, email, dateJoined, role });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return res.status(500).json({ message: "Failed to fetch profile" });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(res);
    if (!user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    const { name, email, password, currentPassword } = req.body;
    const updateFields: Partial<User> = {};
    if (name) updateFields.name = name;
    if (email) updateFields.email = email.toLowerCase();
    if (password) {
      updateFields.password = await argon2.hash(password, {
        type: argon2.argon2id,
      });
    }
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: "No valid fields to update" });
    }
    await collections.users?.updateOne(
      { _id: user._id },
      { $set: updateFields },
    );
    return res.status(200).json({ message: "Profile updated" });
  } catch (error) {
    console.error("Error updating profile:", error);
    return res.status(500).json({ message: "Failed to update profile" });
  }
};

export const deleteMyAccount = async (_req: Request, res: Response) => {
  try {
    const user = await getCurrentUser(res);
    if (!user?._id) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    await collections.users?.deleteOne({ _id: user._id });
    return res.status(200).json({ message: "Account deleted" });
  } catch (error) {
    console.error("Error deleting account:", error);
    return res.status(500).json({ message: "Failed to delete account" });
  }
};

// Below just admin fucntionality
export const getAllUsers = async (_req: Request, res: Response) => {
  try {
    const users = await collections.users?.find({}).toArray();
    if (!users) {
      return res.status(500).json({ message: "Failed to fetch users" });
    }

    // Remove password hashes from response
    const sanitizedUsers = users.map((user) => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });

    return res.status(200).json({ users: sanitizedUsers });
  } catch (error) {
    console.error("Error fetching all users:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  try {
    const userId =
      typeof req.params.userId === "string" ? req.params.userId : "";
    const { role } = req.body;

    // Validate userId
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    // Validate role
    const validRoles = ["admin", "editor", ""];
    if (role === undefined || !validRoles.includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // Find user
    const user = await collections.users?.findOne({
      _id: new ObjectId(userId),
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Update user role
    const result = await collections.users?.updateOne(
      { _id: new ObjectId(userId) },
      { $set: { role } },
    );

    if (!result || result.matchedCount === 0) {
      return res.status(500).json({ message: "Failed to update role" });
    }

    return res.status(200).json({
      message: "Role updated successfully",
      userId,
      role,
    });
  } catch (error) {
    console.error("Error updating user role:", error);
    return res.status(500).json({ message: "Failed to update role" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  try {
    const userId =
      typeof req.params.userId === "string" ? req.params.userId : "";

    // Validate userId
    if (!userId || !ObjectId.isValid(userId)) {
      return res.status(400).json({ message: "Invalid user ID" });
    }

    const result = await collections.users?.deleteOne({
      _id: new ObjectId(userId),
    });

    if (!result || result.deletedCount === 0) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    return res.status(500).json({ message: "Failed to delete user" });
  }
};
