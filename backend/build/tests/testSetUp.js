"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const database_1 = require("../src/database");
beforeAll(async () => {
    console.log("Running before all tests");
    console.log = () => { };
    await (0, database_1.initDb)();
});
afterAll(async () => {
    await (0, database_1.closeDb)();
    console.log = console.log;
});
