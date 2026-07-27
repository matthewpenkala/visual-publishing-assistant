import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const routes = [
  {
    file: new URL("../index.html", import.meta.url),
    canonical:
      "https://matthewpenkala.github.io/visual-publishing-assistant/",
  },
  {
    file: new URL("../privacy/index.html", import.meta.url),
    canonical:
      "https://matthewpenkala.github.io/visual-publishing-assistant/privacy/",
  },
  {
    file: new URL("../support/index.html", import.meta.url),
    canonical:
      "https://matthewpenkala.github.io/visual-publishing-assistant/support/",
  },
];

const canonicalPattern =
  /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/g;
const robotsPattern =
  /<meta\s+name="robots"\s+content="index, follow, noai, noimageai"\s*\/?>/;
const emailPattern =
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/i;

for (const { file, canonical } of routes) {
  test(`${file.pathname} preserves its immutable canonical URL`, () => {
    const html = readFileSync(file, "utf8");
    const canonicalMatches = [...html.matchAll(canonicalPattern)];

    assert.equal(canonicalMatches.length, 1);
    assert.equal(canonicalMatches[0][1], canonical);
    assert.match(html, robotsPattern);
  });
}

test("public sources do not expose a plaintext contact address or mail link", () => {
  const sources = [
    ...routes.map(({ file }) => readFileSync(file, "utf8")),
    readFileSync(new URL("../contact.js", import.meta.url), "utf8"),
  ];

  for (const source of sources) {
    assert.doesNotMatch(source, emailPattern);
    assert.equal(source.toLowerCase().includes("mailto:"), false);
  }
});

test("documentation freezes the complete public URL contract exactly", () => {
  const readme = readFileSync(new URL("../README.md", import.meta.url), "utf8");

  for (const { canonical } of routes) {
    assert.equal(
      readme.split(`\`${canonical}\``).length - 1,
      1,
      `${canonical} must appear exactly once in README.md`,
    );
  }
});
