import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  existsSync,
  readFileSync,
  readdirSync,
  statSync,
} from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

const root = fileURLToPath(new URL("..", import.meta.url));
const obsoleteHosts = ["chatgpt" + ".site", "pages" + ".dev"];
const mailScheme = ["mail", "to:"].join("");
const routes = [
  {
    path: "",
    file: join(root, "index.html"),
    canonical:
      "https://matthewpenkala.github.io/visual-publishing-assistant/",
    favicon: "./assets/vpa-mark.svg",
  },
  {
    path: "privacy/",
    file: join(root, "privacy/index.html"),
    canonical:
      "https://matthewpenkala.github.io/visual-publishing-assistant/privacy/",
    favicon: "../assets/vpa-mark.svg",
  },
  {
    path: "support/",
    file: join(root, "support/index.html"),
    canonical:
      "https://matthewpenkala.github.io/visual-publishing-assistant/support/",
    favicon: "../assets/vpa-mark.svg",
  },
];

const canonicalPattern =
  /<link\s+rel="canonical"\s+href="([^"]+)"\s*\/?>/g;
const emailPattern =
  /[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+/i;
const csp =
  "default-src 'none'; style-src 'self'; script-src 'self'; img-src 'self' data:; connect-src 'none'; font-src 'none'; object-src 'none'; base-uri 'none'; form-action 'none'";

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    if (entry.name === ".git") return [];
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function publishedFiles() {
  return walk(root).filter(
    (path) =>
      !relative(root, path).startsWith("tests/") &&
      relative(root, path) !== "README.md",
  );
}

for (const { file, canonical, favicon } of routes) {
  test(`${relative(root, file)} preserves the complete immutable page contract`, () => {
    const html = readFileSync(file, "utf8");
    const canonicalMatches = [...html.matchAll(canonicalPattern)];

    assert.equal(canonicalMatches.length, 1);
    assert.equal(canonicalMatches[0][1], canonical);
    assert.match(
      html,
      /<meta\s+name="robots"\s+content="index, follow, noai, noimageai"\s*\/?>/,
    );
    assert.match(html, /<meta\s+name="referrer"\s+content="no-referrer"\s*\/?>/);
    assert.match(html, /<meta\s+name="pinterest"\s+content="nopin"\s*\/?>/);
    assert.ok(
      html.includes(
        `<meta http-equiv="Content-Security-Policy" content="${csp}">`,
      ),
    );
    assert.ok(
      html.includes(
        `<link rel="icon" href="${favicon}" type="image/svg+xml">`,
      ),
    );
    assert.ok(
      html.includes(
        "Independent integration; not affiliated with or endorsed by Pinterest.",
      ),
    );
  });
}

test("all published text assets omit contact and obsolete-host literals", () => {
  for (const path of publishedFiles()) {
    if (!/\.(?:html|css|js|txt|svg)$/i.test(path)) continue;
    const source = readFileSync(path, "utf8");
    assert.doesNotMatch(source, emailPattern, relative(root, path));
    assert.equal(source.toLowerCase().includes(mailScheme), false);
    for (const host of obsoleteHosts) {
      assert.equal(source.toLowerCase().includes(host), false);
    }
  }
});

test("HTML resource and navigation paths stay inside the project site", () => {
  for (const { file } of routes) {
    const html = readFileSync(file, "utf8");
    assert.doesNotMatch(html, /(?:href|src)="\/(?!\/)/);

    for (const [, attribute, value] of html.matchAll(
      /\b(href|src)="([^"]+)"/g,
    )) {
      if (
        value.startsWith("#") ||
        value.startsWith("https://matthewpenkala.github.io/")
      ) {
        continue;
      }
      const resource = join(dirname(file), value.split("#", 1)[0]);
      const resolved = statSync(resource).isDirectory()
        ? join(resource, "index.html")
        : resource;
      assert.equal(existsSync(resolved), true, `${attribute} ${value}`);
      assert.equal(relative(root, resolved).startsWith(".."), false);
    }
  }
});

test("served pages load no third-party executable or visual resources", () => {
  for (const { file } of routes) {
    const html = readFileSync(file, "utf8");
    assert.doesNotMatch(
      html,
      /<(?:script|img)\b[^>]+\bsrc="https?:\/\//i,
    );
    assert.doesNotMatch(
      html,
      /<link\b(?=[^>]*\brel="(?:stylesheet|icon)")(?=[^>]*\bhref="https?:\/\/)[^>]*>/i,
    );
    assert.doesNotMatch(html, /<(?:iframe|object|embed|form)\b/i);
  }
});

test("independent brand asset is local, vector, fixed, and non-Pinterest", () => {
  const asset = join(root, "assets/vpa-mark.svg");
  const bytes = readFileSync(asset);
  assert.equal(
    createHash("sha256").update(bytes).digest("hex"),
    "06b865bc28a595eee547041d1159374d72204957e25ef95e4eb17509cfec2ee9",
  );
  const svg = bytes.toString("utf8");
  assert.match(svg, /viewBox="0 0 64 64"/);
  assert.doesNotMatch(svg, /Pinterest|#e60023|\b(?:href|src)="https?:\/\//i);
});

test("homepage qualifies production publishing and uses the independent product identity", () => {
  const html = readFileSync(join(root, "index.html"), "utf8");
  const allHtml = routes
    .map(({ file }) => readFileSync(file, "utf8"))
    .join("\n");
  assert.match(html, /Visual Publishing Assistant/);
  assert.match(html, /Standard-access-gated publishing/i);
  assert.match(html, /production publishing remains gated on Pinterest Standard access/i);
  assert.match(html, /macOS arm64\/x64 and Windows x64/i);
  assert.match(html, /package-local MediaInfo WASM/i);
  assert.match(html, /pinned FFmpeg 8\.1 runtime/i);
  assert.match(html, /No Windows ARM64 build is shipped or claimed/i);
  assert.doesNotMatch(
    allHtml,
    /Windows ARM64 retains|x64\/ia32|compatible packaged probe|media-probe architectures/i,
  );
  assert.doesNotMatch(html, /<title>Pinterest<\/title>|Pinterest (?:app|plugin)<\/h1>/i);
});

test("contact component gates reveal and mail actions behind active human gestures", () => {
  const script = readFileSync(join(root, "contact.js"), "utf8");
  const html = routes.map(({ file }) => readFileSync(file, "utf8")).join("\n");
  assert.match(script, /event\.isTrusted/);
  assert.match(script, /navigator\.userActivation/);
  assert.match(script, /data-contact-state/);
  assert.match(script, /function reveal\(target\)/);
  assert.match(script, /function activateContact\(event\)/);
  assert.match(script, /window\.devicePixelRatio/);
  assert.match(script, /window\.addEventListener\(\s*"resize"/);
  assert.match(script, /canvas\.setAttribute\("aria-hidden", "true"\)/);
  assert.match(html, /aria-label="Reveal the email support address"/);
  assert.match(html, />Reveal email address<noscript>/);
  assert.match(html, /<noscript>/);
});

test("documentation freezes URLs and states crawler-control limitations honestly", () => {
  const readme = readFileSync(join(root, "README.md"), "utf8");
  const robots = readFileSync(join(root, "robots.txt"), "utf8");

  for (const { canonical } of routes) {
    assert.equal(
      readme.split(`\`${canonical}\``).length - 1,
      1,
      `${canonical} must appear exactly once in README.md`,
    );
  }
  assert.match(readme, /not a domain-root\s+robots policy/i);
  assert.match(readme, /not general scraping prevention/i);
  assert.match(readme, /cannot guarantee\s+secrecy after reveal/i);
  assert.match(readme, /aligned\s+with private plugin v0\.5\.4/i);
  assert.match(robots, /does not control domain-wide crawling/i);
});
