"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createUserSchema = exports.Role = void 0;
const zod_1 = require("zod");
var Role;
(function (Role) {
    Role["Admin"] = "admin";
    Role["Editor"] = "editor";
    Role["User"] = "";
})(Role || (exports.Role = Role = {}));
// validation schemas using zod
exports.createUserSchema = zod_1.z.object({
    name: zod_1.z.string().min(1, "Name is required").max(20, "Name too long"),
    email: zod_1.z.string().email("Invalid email"),
    password: zod_1.z.string().min(6, "Password too short"),
    role: zod_1.z.enum(["admin", "editor", ""]),
});
