import {
  applyFrame,
  findTemplate,
  getFrameImage,
  getMaskImage,
  listDevices,
} from "../src/index.js";

// Test listDevices
console.log("=== Testing listDevices ===");
const allDevices = await listDevices();
console.log(`Total devices: ${allDevices.length}`);

const iosDevices = await listDevices("ios");
console.log(`iOS devices: ${iosDevices.length}`);

const iphone16ProMax = await listDevices("ios", "16-pro-max");
console.log(`iPhone 16 Pro Max variations: ${iphone16ProMax.length}`);
for (const variation of iphone16ProMax) {
  console.log(`  - ${variation.variation}`);
}

// Test findTemplate
console.log("\n=== Testing findTemplate ===");
const template = await findTemplate("16-pro-max", "black-titanium", { category: "ios" });
console.log(template);

// Test getFrameImage
console.log("\n=== Testing getFrameImage ===");
const frame = await getFrameImage("16-pro-max", "black-titanium", { category: "ios" });
const frameMetadata = await frame.metadata();
console.log(`Frame image size: ${frameMetadata.width}x${frameMetadata.height}`);
console.log(`Frame image format: ${frameMetadata.format}`);

// Test getMaskImage
console.log("\n=== Testing getMaskImage ===");
const mask = await getMaskImage("16-pro-max", "black-titanium", { category: "ios" });
const maskMetadata = await mask.metadata();
console.log(`Mask image size: ${maskMetadata.width}x${maskMetadata.height}`);
console.log(`Mask image format: ${maskMetadata.format}`);

// Test error handling
console.log("\n=== Testing error handling ===");
try {
  await listDevices(undefined, "16-pro-max"); // Should fail - no category
} catch (error) {
  console.log(`✓ Caught expected error: ${(error as Error).message}`);
}

// Test applyFrame
console.log("\n=== Testing applyFrame ===");
const output = await applyFrame(
  "tests/iphone.PNG",
  "16-pro-max",
  "black-titanium",
  "tests/iphone_framed.png",
  { category: "ios" }
);
console.log("✓ Frame applied successfully");
console.log(`Output: ${output}`);
