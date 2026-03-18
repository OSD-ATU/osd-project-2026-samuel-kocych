const test = require("node:test");
const assert = require("node:assert/strict");

const { handler } = require("./index");

test("returns 204 for CORS preflight", async () => {
  const event = { httpMethod: "OPTIONS" };
  const context = { callbackWaitsForEmptyEventLoop: true };

  const result = await handler(event, context);

  assert.equal(result.statusCode, 204);
  assert.equal(result.headers["Access-Control-Allow-Origin"], "*");
});
