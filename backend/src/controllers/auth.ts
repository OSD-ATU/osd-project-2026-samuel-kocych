import { Request, Response } from "express";
import { collections } from "../database";
import { createUserSchema, Role, User } from "../models/user";
import * as argon2 from "argon2";
import { sign as jwtSign } from "jsonwebtoken";

// create JWT access token
const createAccessToken = (user: User): string => {
  const secret = process.env.JWTSECRET!;
  const expiresTime = "20 mins";
  const payload = {
    userId: user._id?.toString(),
    email: user.email,
    name: user.name,
    role: user.role,
  };

  return jwtSign(payload, secret, { expiresIn: expiresTime });
};

// register a new user
export const registerUser = async (req: Request, res: Response) => {
  const validation = createUserSchema.safeParse(req.body);
  if (!validation.success)
    return res.status(400).json({ errors: validation.error.issues });

  const { name, email, password } = validation.data;

  // check if user already exists
  const existingUser = await collections.users?.findOne({
    email: email.toLowerCase(),
  });
  if (existingUser)
    return res.status(400).json({ message: "Email already exists" });

  const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });

  const newUser: User = {
    name,
    email: email.toLowerCase(),
    password: hashedPassword,
    dateJoined: new Date(),
    role: (validation.data.role || "") as Role,
    favorites: [],
  };

  const result = await collections.users?.insertOne(newUser);
  if (!result)
    return res.status(500).json({ message: "Failed to create user" });

  res
    .status(201)
    .json({ message: "User registered", userId: result.insertedId });
};

// login
export const loginUser = async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const dummyHash = await argon2.hash("time wasting");

  if (!email || !password) {
    res.status(400).json({ message: "Email and password are required" });
    return;
  }

  const user = (await collections.users?.findOne({
    email: (email as string).toLowerCase(),
  })) as unknown as User;

  if (user && user.password) {
    const isPasswordValid = await argon2.verify(user.password, password);
    if (isPasswordValid) {
      // return only safe fields
      res.status(201).json({
        token: createAccessToken(user),
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          dateJoined: user.dateJoined,
        },
      });
    } else {
      res.status(401).json({ message: "Invalid email or password!" });
    }
    return;
  }

  await argon2.verify(dummyHash, password);
  res.status(401).json({ message: "Invalid email or password!" });
};
