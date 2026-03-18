const test = require("node:test");
const assert = require("node:assert/strict");

const { handler } = require("./index");

test("returns 400 for invalid user id", async () => {
  const event = {
    httpMethod: "PATCH",
    pathParameters: { userId: "invalid-id" },
    body: JSON.stringify({ role: "admin" }),
  };
  const context = { callbackWaitsForEmptyEventLoop: true };

  const result = await handler(event, context);
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 400);
  assert.equal(body.message, "Invalid user ID");
});

test("returns 400 for invalid role", async () => {
  const event = {
    httpMethod: "PATCH",
    pathParameters: { userId: "507f1f77bcf86cd799439011" },
    body: JSON.stringify({ role: "owner" }),
  };
  const context = { callbackWaitsForEmptyEventLoop: true };

  const result = await handler(event, context);
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 400);
  assert.equal(body.message, "Invalid role");
});
