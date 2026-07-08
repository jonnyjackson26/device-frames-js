TypeScript/Node core library for applying device frames to screenshots and retrieving up-to-date media of device frame PNGs (with metadata)

![applyFrame function example](https://raw.githubusercontent.com/jonnyjackson26/device-frames-js/main/docs/example.png)

```bash
npm install device-frames
```

```ts
import { applyFrame, listDevices } from "device-frames";

// List devices
const allDevices = await listDevices();

// Apply a frame
await applyFrame(
  "input.png",
  "16-pro-max",
  "black-titanium",
  "output/framed.png",
  { category: "apple-iphone" }
);
```

Notes
-----

- Device frames and masks are fetched at runtime from https://github.com/jonnyjackson26/device-frames-media. This ensures you always have updated data. If you need a frame that's not listed there, please [add it](https://github.com/jonnyjackson26/device-frames-media?tab=contributing-ov-file)
- The package depends on [sharp](https://sharp.pixelplumbing.com/) for image compositing, so it runs in Node.js (server, CLI, build scripts) — not in the browser.
- Device and variation names use lowercase kebab-case (e.g., "16-pro-max", "black-titanium").

---
[Read more about this project on my website](https://jonny-jackson.com/posts/device-frames/)  
[Github repo](https://github.com/jonnyjackson26/device-frames-js)  
[device-frames-media Github repo](https://github.com/jonnyjackson26/device-frames-media)  
