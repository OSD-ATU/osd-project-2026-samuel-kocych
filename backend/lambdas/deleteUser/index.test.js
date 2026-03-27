const test = require("node:test");
const assert = require("node:assert/strict");

const { handler } = require("./index");

test("returns 400 for invalid user id", async () => {
  const event = {
    httpMethod: "DELETE",
    pathParameters: { userId: "invalid-id" },
  };
  const context = { callbackWaitsForEmptyEventLoop: true };

  const result = await handler(event, context);
  const body = JSON.parse(result.body);

  assert.equal(result.statusCode, 401);
  assert.equal(body.message, "Invalid user ID");
});
