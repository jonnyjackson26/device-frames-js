export class DeviceFramesError extends Error {
  constructor(message?: string) {
    super(message);
    this.name = "DeviceFramesError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TemplateNotFoundError extends DeviceFramesError {
  constructor(message?: string) {
    super(message);
    this.name = "TemplateNotFoundError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class TemplateAmbiguousError extends DeviceFramesError {
  constructor(message?: string) {
    super(message);
    this.name = "TemplateAmbiguousError";
    Object.setPrototypeOf(this, new.target.prototype);
  }
}
