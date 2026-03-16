"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = void 0;
const validate = (schema) => (req, res, next) => {
    const validation = schema.safeParse(req.body);
    if (!validation.success) {
        return res.status(400).json({
            message: "Validation failed",
            errors: validation.error.issues,
        });
    }
    req.body = validation.data;
    next();
};
exports.validate = validate;
