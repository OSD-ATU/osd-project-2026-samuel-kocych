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
exports.loginUser = exports.registerUser = void 0;
const database_1 = require("../database");
const user_1 = require("../models/user");
const argon2 = __importStar(require("argon2"));
const jsonwebtoken_1 = require("jsonwebtoken");
// create JWT access token
const createAccessToken = (user) => {
    const secret = process.env.JWTSECRET;
    const expiresTime = "20 mins";
    const payload = {
        userId: user._id?.toString(),
        email: user.email,
        name: user.name,
        role: user.role,
    };
    return (0, jsonwebtoken_1.sign)(payload, secret, { expiresIn: expiresTime });
};
// register a new user
const registerUser = async (req, res) => {
    const validation = user_1.createUserSchema.safeParse(req.body);
    if (!validation.success)
        return res.status(400).json({ errors: validation.error.issues });
    const { name, email, password } = validation.data;
    // check if user already exists
    const existingUser = await database_1.collections.users?.findOne({
        email: email.toLowerCase(),
    });
    if (existingUser)
        return res.status(400).json({ message: "Email already exists" });
    const hashedPassword = await argon2.hash(password, { type: argon2.argon2id });
    const newUser = {
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        dateJoined: new Date(),
        role: (validation.data.role || ""),
        favorites: [],
    };
    const result = await database_1.collections.users?.insertOne(newUser);
    if (!result)
        return res.status(500).json({ message: "Failed to create user" });
    res
        .status(201)
        .json({ message: "User registered", userId: result.insertedId });
};
exports.registerUser = registerUser;
// login
const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const dummyHash = await argon2.hash("time wasting");
    if (!email || !password) {
        res.status(400).json({ message: "Email and password are required" });
        return;
    }
    const user = (await database_1.collections.users?.findOne({
        email: email.toLowerCase(),
    }));
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
        }
        else {
            res.status(401).json({ message: "Invalid email or password!" });
        }
        return;
    }
    await argon2.verify(dummyHash, password);
    res.status(401).json({ message: "Invalid email or password!" });
};
exports.loginUser = loginUser;
