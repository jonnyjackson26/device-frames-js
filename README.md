# device-frames-js [View on npm](https://www.npmjs.com/package/device-frames-js)

TypeScript/Node core library for applying device frames to screenshots and retrieving up-to-date media of device frame PNGs (with metadata)

![applyFrame function example](docs/example.png)

### Usage Example

```bash
npm install device-frames-js
```

```ts
import { applyFrame, listDevices } from "device-frames-js";

// List devices
const allDevices = await listDevices();

// Apply a frame
await applyFrame(
  "input.png",
  "16-pro-max",
  "black-titanium",
  "output/framed.png",
  { category: "ios" }
);
```

Notes
-----

- Device frames and masks are fetched at runtime from https://github.com/jonnyjackson26/device-frames-media. This ensures you always have updated data. If you need a frame that's not listed there, please [add it](https://github.com/jonnyjackson26/device-frames-media?tab=contributing-ov-file)
- The package depends on [sharp](https://sharp.pixelplumbing.com/) for image compositing, so it runs in Node.js (server, CLI, build scripts) — not in the browser.
- Device and variation names use lowercase kebab-case (e.g., "16-pro-max", "black-titanium").

### Local Testing with tests/test.ts:
```bash
npm install
npm test              # run test file
```

### Local package build
```bash
rm -rf dist
npm install
npm run build          # compiles src/ to dist/
```
Install the built package locally and do a quick import check:
```bash
npm pack
npm install ./device-frames-js-*.tgz
node -e "import('device-frames-js').then(m => m.listDevices().then(d => console.log(d.length)))"
```

### Publish to npm
This project publishes to npm using GitHub Actions via the [`.github/workflows/publish.yml`](.github/workflows/publish.yml) workflow, triggered when a GitHub Release is published (`release.published`).

1. Update version in `package.json`.
2. Commit and push to `main`.
3. Create and push a matching git tag:
   - `git tag v0.1.1`
   - `git push origin v0.1.1`
4. In GitHub:
   - Open **Releases** → **Draft a new release**
   - Choose tag `v0.1.1`
   - Set release title (for example, `v0.1.1`)
   - Add release notes
   - Click **Publish release**
5. GitHub Actions runs `Publish to npm` and publishes the package to npm.

---
[Read more about this project on my website](https://jonny-jackson.com/posts/device-frames/)
[npm](https://www.npmjs.com/package/device-frames-js)
[device-frames-media Github repo](https://github.com/jonnyjackson26/device-frames-media)
