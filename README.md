# AniLife Providers

A collection of AniLife WASM provider extensions for multiple anime streaming sites, built with JavaScript ComponentizeJS (`@bytecodealliance/componentize-js@0.23.0`) and the `anilili:provider@1.0.0` WIT contract.

Each provider lives on its own branch and compiles to a `.wasm` component via the GitHub Action workflow (`.github/workflows/build-all.yml`), which builds every branch and publishes the artifacts.

## Providers

| Anime Site | GitHub Branch | Live Site |
|---|---|---|
| `animesalt.cx` | [add-animesalt-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-animesalt-provider) | [animesalt.cx](https://animesalt.cx/) |
| `verani.me` | [verani-me](https://github.com/pecta675-ctrl/example-extension/tree/verani-me) | [verani.me](https://verani.me/) |
| `latanime.org` | [add-latanime-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-latanime-provider) | [latanime.org](https://latanime.org/) |
| `animeonline.ninja` | [add-animeonline-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-animeonline-provider) | [animeonline.ninja](https://ver2.animeonline.ninja/) |
| `aniwaves.tv` | [add-animewaves-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-animewaves-provider) | [aniwaves.tv](https://aniwaves.tv/) |
| `watchanimeworld.one` | [add-watchanimeworld-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-watchanimeworld-provider) | [watchanimeworld.one](https://watchanimeworld.one/) |
| `jkanime.net` | [add-jkanime-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-jkanime-provider) | [jkanime.net](https://jkanime.net/) |
| `hanime.tv` | [feat/provider-hanime](https://github.com/pecta675-ctrl/example-extension/tree/feat/provider-hanime) | [hanime.tv](https://hanime.tv/) |

Inline reference:

* `animesalt.cx` -> [add-animesalt-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-animesalt-provider) [animesalt.cx](https://animesalt.cx/)
* `verani.me` -> [verani-me](https://github.com/pecta675-ctrl/example-extension/tree/verani-me) [verani.me](https://verani.me/)
* `latanime.org` -> [add-latanime-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-latanime-provider) [latanime.org](https://latanime.org/)
* `animeonline.ninja` -> [add-animeonline-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-animeonline-provider) [animeonline.ninja](https://ver2.animeonline.ninja/)
* `aniwaves.tv` -> [add-animewaves-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-animewaves-provider) [aniwaves.tv](https://aniwaves.tv/)
* `watchanimeworld.one` -> [add-watchanimeworld-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-watchanimeworld-provider) [watchanimeworld.one](https://watchanimeworld.one/)
* `jkanime.net` -> [add-jkanime-provider](https://github.com/pecta675-ctrl/example-extension/tree/add-jkanime-provider) [jkanime.net](https://jkanime.net/)
* `hanime.tv` -> [feat/provider-hanime](https://github.com/pecta675-ctrl/example-extension/tree/feat/provider-hanime) [hanime.tv](https://hanime.tv/)

## Build

Each provider branch contains `scraper/build.mjs` (and `build.sh`/`build.bat` helpers). To build a provider manually:

```bash
cd scraper
npm install @bytecodealliance/componentize-js@0.23.0 @bytecodealliance/jco-transpile@0.23.0 --save-dev
node build.mjs
```

The output is `<provider>.wasm` (verified wasm magic bytes `00 61 73 6d 0d 00 01 00`). Import that `.wasm` file into AniLife.

## ABI

All providers use the WIT package `anilili:provider@1.0.0` with host interface `anilili:provider/host@1.0.0`. World `provider` exports `info` and `servers`.

Note: `jkanime.net` is protected by Cloudflare over plain HTTP, so its provider relies on the host `browser-fetch` function rather than `http`.
