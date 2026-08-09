import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/month/2026/08") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(
    new Request(`http://localhost${pathname}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("server-renders the monthly planner", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Little Day Planner/);
  assert.match(html, /August 2026/);
  assert.match(html, /Monthly notes/);
  assert.match(html, /Open week beginning 2026-07-26/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/);
});

test("server-renders the matching weekly planner", async () => {
  const response = await render("/week/2026-08-09");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /AUG 9 – 15, 2026/);
  assert.match(html, /Events/);
  assert.match(html, /Tasks/);
  assert.match(html, /Back to month/);
});
