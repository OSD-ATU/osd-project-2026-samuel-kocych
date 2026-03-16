"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const supertest_1 = __importDefault(require("supertest"));
const src_1 = require("../../src");
describe("Basic server running and answering ping", () => {
    test("Testing the ping", async () => {
        const res = await (0, supertest_1.default)(src_1.app).get("/ping");
        expect(res.body).toEqual({ message: "Welcome to my recipe API!" });
    });
});
