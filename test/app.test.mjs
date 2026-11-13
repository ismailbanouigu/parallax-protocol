import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const html = readFileSync(new URL("../dist/index.html", import.meta.url), "utf8");
const js = readFileSync(new URL("../dist/app.js", import.meta.url), "utf8");
const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

test("is wired to Quest 19178 and two live Pollinations models", () => {
  assert.match(html, /Quest #19178/);
  assert.match(html, /openai\/gpt-5\.4-nano/);
  assert.match(html, /deepseek\/deepseek-v4\.1-flash/);
});

test("agents receive different private evidence and share a transcript", () => {
  assert.match(js, /state\.incident\.cipher/);
  assert.match(js, /state\.incident\.echo/);
  assert.match(js, /Shared transcript/);
});

test("live play uses BYOP and direct-click spending guard", () => {
  assert.match(js, /Authorization: `Bearer \$\{connect\.apiKey\}`/);
  assert.match(js, /event\.isTrusted/);
  assert.match(html, /temporary Pollinations key/);
});

test("ships a zero-Pollen demo and deterministic code verdict", () => {
  assert.match(html, /ZERO-POLLEN DEMO/);
  assert.match(js, /choice === state\.incident\.answer/);
});

test("ships the Pollinations badge without a secret key", () => {
  assert.match(readme, /badge-made-with\.svg/);
  assert.doesNotMatch(`${html}\n${js}`, /sk_[A-Za-z0-9_-]+/);
});
