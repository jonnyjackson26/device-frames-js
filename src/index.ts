export {
  applyFrame,
  findTemplate,
  getFrameImage,
  getMaskImage,
  listDevices,
} from "./core.js";
export type {
  ApplyFrameOptions,
  DeviceListing,
  RgbaColor,
} from "./core.js";
export { DeviceFramesError, TemplateAmbiguousError, TemplateNotFoundError } from "./errors.js";
