import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import sharp from "sharp";

import { TemplateAmbiguousError, TemplateNotFoundError } from "./errors.js";

// URL to the device frames index JSON
const DEVICE_FRAMES_INDEX_URL =
  "https://raw.githubusercontent.com/jonnyjackson26/device-frames-media/main/device-frames-output/index.json";

interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Size {
  width: number;
  height: number;
}

interface TemplateData {
  frame: string;
  mask: string;
  frameSize: Size;
  screen: Rect;
  hexColor?: string;
}

type DeviceFramesIndex = Record<string, Record<string, Record<string, TemplateData>>>;

export interface DeviceListing {
  category: string;
  device: string;
  variation: string;
  frameSize: Size | Record<string, never>;
  screen: Rect | Record<string, never>;
  hexColor: string | null;
}

export interface RgbaColor {
  r: number;
  g: number;
  b: number;
  alpha?: number;
}

export interface ApplyFrameOptions {
  category?: string;
  backgroundColor?: RgbaColor;
}

// Cache for the device frames index
let deviceFramesCache: DeviceFramesIndex | null = null;

/** Fetch and cache the device frames index from the remote URL. */
async function getDeviceFramesIndex(): Promise<DeviceFramesIndex> {
  if (deviceFramesCache === null) {
    const response = await fetch(DEVICE_FRAMES_INDEX_URL);
    if (!response.ok) {
      throw new Error(
        `Failed to fetch device frames index: ${response.status} ${response.statusText}`
      );
    }
    deviceFramesCache = (await response.json()) as DeviceFramesIndex;
  }

  return deviceFramesCache;
}

/**
 * Return all available devices and variations, optionally filtered by category and/or device.
 *
 * If device is specified, category must also be specified.
 */
export async function listDevices(
  category?: string,
  device?: string
): Promise<DeviceListing[]> {
  if (device && !category) {
    throw new Error("category must be specified when device is specified");
  }

  const index = await getDeviceFramesIndex();
  const devices: DeviceListing[] = [];

  for (const [categoryName, categoryDevices] of Object.entries(index)) {
    if (category && categoryName !== category) continue;

    for (const [deviceName, deviceVariations] of Object.entries(categoryDevices)) {
      if (device && deviceName !== device) continue;

      for (const [variationName, variationData] of Object.entries(deviceVariations)) {
        devices.push({
          category: categoryName,
          device: deviceName,
          variation: variationName,
          frameSize: variationData.frameSize ?? {},
          screen: variationData.screen ?? {},
          hexColor: variationData.hexColor ?? null,
        });
      }
    }
  }

  return devices;
}

/** Find and return the template data for the given device and variation. */
async function findTemplateData(
  device: string,
  variation: string,
  category?: string
): Promise<TemplateData> {
  const index = await getDeviceFramesIndex();
  const matches: { category: string; data: TemplateData }[] = [];

  for (const [categoryName, categoryDevices] of Object.entries(index)) {
    if (category && categoryName !== category) continue;

    for (const [deviceName, deviceVariations] of Object.entries(categoryDevices)) {
      if (deviceName !== device) continue;

      if (variation in deviceVariations) {
        matches.push({ category: categoryName, data: deviceVariations[variation] });
      }
    }
  }

  if (matches.length === 0) {
    throw new TemplateNotFoundError(
      `No template found for device='${device}', variation='${variation}', category='${category}'.`
    );
  }

  if (matches.length > 1) {
    throw new TemplateAmbiguousError(
      "Multiple templates matched. Specify a category to disambiguate."
    );
  }

  return matches[0].data;
}

/** Load and return the template data for the given device and variation. */
export async function findTemplate(
  device: string,
  variation: string,
  options: { category?: string } = {}
): Promise<TemplateData> {
  return findTemplateData(device, variation, options.category);
}

/** Download an image from a URL and return it as a Buffer. */
async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download image: ${response.status} ${response.statusText}`);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Load and return the frame image for the given device and variation. */
export async function getFrameImage(
  device: string,
  variation: string,
  options: { category?: string } = {}
): Promise<sharp.Sharp> {
  const template = await findTemplateData(device, variation, options.category);
  return sharp(await downloadImage(template.frame));
}

/** Load and return the mask image for the given device and variation. */
export async function getMaskImage(
  device: string,
  variation: string,
  options: { category?: string } = {}
): Promise<sharp.Sharp> {
  const template = await findTemplateData(device, variation, options.category);
  return sharp(await downloadImage(template.mask));
}

/**
 * Grow each channel of a raw single-band buffer by taking the max of its 3x3
 * neighbourhood. Equivalent to PIL's `ImageFilter.MaxFilter(3)`: for a rank
 * (max) filter, edge-replicated padding never introduces a value greater
 * than the edge pixel itself, so skipping out-of-bounds neighbours yields
 * an identical result to PIL's edge handling.
 */
function maxFilter3x3(buffer: Buffer, width: number, height: number): Buffer {
  const output = Buffer.alloc(buffer.length);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let max = 0;

      for (let dy = -1; dy <= 1; dy++) {
        const ny = y + dy;
        if (ny < 0 || ny >= height) continue;

        for (let dx = -1; dx <= 1; dx++) {
          const nx = x + dx;
          if (nx < 0 || nx >= width) continue;

          const value = buffer[ny * width + nx];
          if (value > max) max = value;
        }
      }

      output[y * width + x] = max;
    }
  }

  return output;
}

/** Apply a device frame to a screenshot and save the output image. */
export async function applyFrame(
  screenshotPath: string,
  device: string,
  variation: string,
  outputPath: string,
  options: ApplyFrameOptions = {}
): Promise<string> {
  const template = await findTemplateData(device, variation, options.category);
  const backgroundColor: RgbaColor = options.backgroundColor ?? { r: 0, g: 0, b: 0, alpha: 0 };

  // Download frame and mask images
  const [frameBuffer, maskBuffer] = await Promise.all([
    downloadImage(template.frame),
    downloadImage(template.mask),
  ]);

  const { screen, frameSize } = template;

  const screenshotRgb = await sharp(screenshotPath)
    .resize(screen.width, screen.height, { kernel: "lanczos3" })
    .removeAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const maskRegion = await sharp(maskBuffer)
    .extract({ left: screen.x, top: screen.y, width: screen.width, height: screen.height })
    .greyscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const dilatedMask = maxFilter3x3(maskRegion.data, maskRegion.info.width, maskRegion.info.height);

  const screenshotWithAlpha = await sharp(screenshotRgb.data, {
    raw: { width: screenshotRgb.info.width, height: screenshotRgb.info.height, channels: 3 },
  })
    .joinChannel(dilatedMask, {
      raw: { width: maskRegion.info.width, height: maskRegion.info.height, channels: 1 },
    })
    .png()
    .toBuffer();

  await mkdir(dirname(outputPath), { recursive: true });

  await sharp({
    create: {
      width: frameSize.width,
      height: frameSize.height,
      channels: 4,
      background: backgroundColor,
    },
  })
    .composite([
      { input: screenshotWithAlpha, left: screen.x, top: screen.y },
      { input: frameBuffer, left: 0, top: 0 },
    ])
    .png()
    .toFile(outputPath);

  return outputPath;
}
