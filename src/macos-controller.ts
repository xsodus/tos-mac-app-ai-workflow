import { execFile } from "node:child_process";
import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export type Point = {
  x: number;
  y: number;
};

export type WindowBounds = Point & {
  width: number;
  height: number;
};

export type ImageSize = {
  width: number;
  height: number;
};

export type MacAppControllerOptions = {
  commandTimeoutMs?: number;
};

export type MacAutomationPermissions = {
  accessibility: boolean;
  screenRecording: boolean;
  screenshotPath: string;
};

const APPLE_SCRIPT_MODIFIERS = new Set(["command", "control", "option", "shift"]);

export class MacAppController {
  readonly commandTimeoutMs: number;

  constructor(options: MacAppControllerOptions = {}) {
    this.commandTimeoutMs = options.commandTimeoutMs ?? 15_000;
  }

  async launchViaSpotlight(
    query = "Tree of Savior M Extreme",
    processName = "TOSM TH",
  ): Promise<void> {
    await this.runAppleScript([
      'tell application "System Events"',
      "key code 49 using {command down}",
      "delay 0.5",
      `keystroke ${appleScriptString(query)}`,
      "delay 1",
      "key code 36",
      "end tell",
    ]);
    await this.focusApp(processName);
  }

  async focusApp(processName: string): Promise<void> {
    await this.runAppleScript([
      'tell application "System Events"',
      "repeat 30 times",
      `if exists process ${appleScriptString(processName)} then`,
      `set frontmost of process ${appleScriptString(processName)} to true`,
      "return",
      "end if",
      "delay 0.5",
      "end repeat",
      `error "Timed out waiting for process ${escapeAppleScriptError(processName)}"`,
      "end tell",
    ]);
  }

  async click(point: Point): Promise<void> {
    assertInteger(point.x, "x");
    assertInteger(point.y, "y");
    const source = [
      "import CoreGraphics",
      "import Foundation",
      `let point = CGPoint(x: ${point.x}, y: ${point.y})`,
      'CGEvent(mouseEventSource: nil, mouseType: .mouseMoved, mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)',
      "usleep(50_000)",
      'CGEvent(mouseEventSource: nil, mouseType: .leftMouseDown, mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)',
      "usleep(50_000)",
      'CGEvent(mouseEventSource: nil, mouseType: .leftMouseUp, mouseCursorPosition: point, mouseButton: .left)?.post(tap: .cghidEventTap)',
    ].join("\n");
    await this.run("/usr/bin/swift", ["-e", source]);
  }

  async pressKey(keyCode: number, modifiers: string[] = []): Promise<void> {
    assertNonNegativeInteger(keyCode, "keyCode");
    for (const modifier of modifiers) {
      if (!APPLE_SCRIPT_MODIFIERS.has(modifier)) {
        throw new TypeError(`Unsupported modifier: ${modifier}`);
      }
    }
    const using =
      modifiers.length > 0 ? ` using {${modifiers.map((item) => `${item} down`).join(", ")}}` : "";
    await this.runAppleScript([
      'tell application "System Events"',
      `key code ${keyCode}${using}`,
      "end tell",
    ]);
  }

  async screenshot(outputPath: string): Promise<string> {
    await mkdir(dirname(outputPath), { recursive: true });
    await this.run("/usr/sbin/screencapture", ["-x", outputPath]);
    return outputPath;
  }

  async getWindowBounds(processName = "TOSM TH"): Promise<WindowBounds> {
    const output = await this.runAppleScript([
      'tell application "System Events"',
      `tell process ${appleScriptString(processName)}`,
      "set {windowX, windowY} to position of window 1",
      "set {windowWidth, windowHeight} to size of window 1",
      'return (windowX as text) & "," & (windowY as text) & "," & (windowWidth as text) & "," & (windowHeight as text)',
      "end tell",
      "end tell",
    ]);
    return parseWindowBounds(output);
  }

  async screenshotWindow(
    outputPath: string,
    processName = "TOSM TH",
  ): Promise<{ path: string; bounds: WindowBounds; imageSize: ImageSize }> {
    const bounds = await this.getWindowBounds(processName);
    await mkdir(dirname(outputPath), { recursive: true });
    const rectangle = `${bounds.x},${bounds.y},${bounds.width},${bounds.height}`;
    await this.run("/usr/sbin/screencapture", ["-x", "-R", rectangle, outputPath]);
    const imageSize = await this.getImageSize(outputPath);
    return { path: outputPath, bounds, imageSize };
  }

  async clickWindowImage(
    imagePoint: Point,
    imagePath: string,
    processName = "TOSM TH",
  ): Promise<{
    imagePoint: Point;
    windowPoint: Point;
    globalPoint: Point;
    bounds: WindowBounds;
    imageSize: ImageSize;
  }> {
    assertNonNegativeInteger(imagePoint.x, "x");
    assertNonNegativeInteger(imagePoint.y, "y");
    const bounds = await this.getWindowBounds(processName);
    const imageSize = await this.getImageSize(imagePath);

    if (imagePoint.x >= imageSize.width || imagePoint.y >= imageSize.height) {
      throw new RangeError(
        `Image point ${imagePoint.x},${imagePoint.y} is outside ${imageSize.width}x${imageSize.height}`,
      );
    }

    const windowPoint = imagePointToWindowPoint(imagePoint, imageSize, bounds);
    const globalPoint = {
      x: bounds.x + windowPoint.x,
      y: bounds.y + windowPoint.y,
    };
    await this.focusApp(processName);
    await this.click(globalPoint);
    return { imagePoint, windowPoint, globalPoint, bounds, imageSize };
  }

  async checkPermissions(screenshotPath: string): Promise<MacAutomationPermissions> {
    let accessibility = false;
    let screenRecording = false;

    try {
      await this.runAppleScript([
        'tell application "System Events"',
        "set accessibilityEnabled to UI elements enabled",
        "end tell",
      ]);
      accessibility = true;
    } catch {
      // Report both permissions together instead of stopping at the first failure.
    }

    try {
      await this.screenshot(screenshotPath);
      screenRecording = true;
    } catch {
      // The caller receives a structured result suitable for CLI diagnostics.
    }

    return { accessibility, screenRecording, screenshotPath };
  }

  private async runAppleScript(lines: string[]): Promise<string> {
    const args = lines.flatMap((line) => ["-e", line]);
    return this.run("/usr/bin/osascript", args);
  }

  private async getImageSize(imagePath: string): Promise<ImageSize> {
    const output = await this.run("/usr/bin/sips", [
      "-g",
      "pixelWidth",
      "-g",
      "pixelHeight",
      imagePath,
    ]);
    const width = Number(output.match(/pixelWidth:\s*(\d+)/)?.[1]);
    const height = Number(output.match(/pixelHeight:\s*(\d+)/)?.[1]);
    if (!Number.isSafeInteger(width) || !Number.isSafeInteger(height)) {
      throw new Error(`Could not read image size: ${imagePath}`);
    }
    return { width, height };
  }

  private async run(command: string, args: string[]): Promise<string> {
    try {
      const { stdout } = await execFileAsync(command, args, {
        timeout: this.commandTimeoutMs,
      });
      return stdout.trim();
    } catch (error) {
      const detail = error instanceof Error ? error.message : String(error);
      throw new Error(
        `macOS automation command failed. Check Accessibility and Screen Recording permissions. ${detail}`,
        { cause: error },
      );
    }
  }
}

function appleScriptString(value: string): string {
  return `"${value.replaceAll("\\", "\\\\").replaceAll('"', '\\"')}"`;
}

function escapeAppleScriptError(value: string): string {
  return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

function assertInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value)) {
    throw new TypeError(`${name} must be an integer`);
  }
}

function assertNonNegativeInteger(value: number, name: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new TypeError(`${name} must be a non-negative integer`);
  }
}

export function parseWindowBounds(output: string): WindowBounds {
  const values = output.trim().split(",").map(Number);
  if (values.length !== 4 || values.some((value) => !Number.isSafeInteger(value))) {
    throw new Error(`Could not parse window bounds: ${output}`);
  }

  const [x, y, width, height] = values;
  if (width <= 0 || height <= 0) {
    throw new Error(`Window has invalid size: ${width}x${height}`);
  }
  return { x, y, width, height };
}

export function imagePointToWindowPoint(
  imagePoint: Point,
  imageSize: ImageSize,
  bounds: WindowBounds,
): Point {
  return {
    x: Math.round((imagePoint.x * bounds.width) / imageSize.width),
    y: Math.round((imagePoint.y * bounds.height) / imageSize.height),
  };
}
