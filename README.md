# Visual Publishing Assistant public pages

Public landing, privacy, and support pages for Matthew Penkala's internal,
local-first macOS arm64/x64 and Windows x64 Visual Publishing Assistant
integration.

## Immutable public URL contract

The website and privacy URLs below were submitted with Pinterest application
1594981. They must not be replaced, redirected, normalized to a different
trailing-slash form, or moved to another host. The support URL is the fixed
companion URL under the same approved GitHub Pages project:

- Website: `https://matthewpenkala.github.io/visual-publishing-assistant/`
- Privacy: `https://matthewpenkala.github.io/visual-publishing-assistant/privacy/`
- Support: `https://matthewpenkala.github.io/visual-publishing-assistant/support/`

## Platform contract

The current local-media implementation uses package-local MediaInfo WASM and
one pinned FFmpeg 8.1 runtime on macOS arm64/x64 and Windows x64. The project
does not ship or claim Windows ARM64 support. This public contract is aligned
with private plugin v0.5.4; keep it synchronized with the plugin manifest and
capability matrix.

## Verify

All three pages use the page-level Pinterest `nopin` directive to prevent
ordinary saves to Pinterest, plus best-effort `noai`/`noimageai` robots
metadata. Those cooperative directives are not general scraping prevention.

The support address is absent from published HTML, DOM text, attributes, and
links. Its encoded character data is decoded only after an active trusted user
gesture and is painted into an `aria-hidden` high-DPI canvas; a second active
gesture constructs the mail action in memory. This blocks ordinary source/DOM
harvesters and passive screenshot-at-load collection. It cannot guarantee
secrecy after reveal: determined browser automation or OCR can capture anything
a human is ultimately allowed to see on a public static page.

The served `visual-publishing-assistant/robots.txt` file is not a domain-root
robots policy. Standards-based crawlers consult
`https://matthewpenkala.github.io/robots.txt`, which this project repository
cannot control. The project-path file is retained only as a documented
fallback for a future separately owned origin.

Run the URL, anti-leak, and metadata contract tests with:

```sh
node --test tests/site-contract.test.mjs
```
