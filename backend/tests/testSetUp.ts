import { initDb, closeDb } from "../src/database";

beforeAll(async () => {
  console.log("Running before all tests");
  console.log = () => {};
  await initDb();
});

afterAll(async () => {
  await closeDb();
  console.log = console.log;
});
