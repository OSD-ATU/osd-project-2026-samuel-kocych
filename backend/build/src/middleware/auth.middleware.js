"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.validJWTProvided = void 0;
const jsonwebtoken_1 = require("jsonwebtoken");
const validJWTProvided = async (req, res, next) => {
    const authHeader = req.headers?.authorization;
    if (!authHeader || !authHeader?.startsWith("Bearer")) {
        console.log("No header " + authHeader);
        res.status(401).send();
        return;
    }
    const token = authHeader.split(" ")[1];
    if (!token) {
        res.status(401).send();
        return;
    }
    const secret = process.env.JWTSECRET;
    try {
        console.log(token);
        const payload = (0, jsonwebtoken_1.verify)(token, secret);
        res.locals.payload = payload;
        next();
    }
    catch (err) {
        res.status(403).send();
        return;
    }
};
exports.validJWTProvided = validJWTProvided;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
        const role = res.locals?.payload?.role;
        if (role === undefined || role === null)
            return res.status(401).json({ message: "Not authenticated" });
        if (allowedRoles.includes(role)) {
            next();
        }
        else {
            return res.status(403).json({ message: "Forbidden: insufficient role" });
        }
    };
};
exports.requireRole = requireRole;
