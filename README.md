# Visual Publishing Assistant public pages

Public landing, privacy, and support pages for Matthew Penkala's internal,
local-first Visual Publishing Assistant MVP.

## Immutable public URL contract

The website and privacy URLs below were submitted with Pinterest application
1594981. They must not be replaced, redirected, normalized to a different
trailing-slash form, or moved to another host. The support URL is the fixed
companion URL under the same approved GitHub Pages project:

- Website: `https://matthewpenkala.github.io/visual-publishing-assistant/`
- Privacy: `https://matthewpenkala.github.io/visual-publishing-assistant/privacy/`
- Support: `https://matthewpenkala.github.io/visual-publishing-assistant/support/`

## Verify

Run the URL, anti-leak, and metadata contract tests with:

```sh
node --test tests/site-contract.test.mjs
```
