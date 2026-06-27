import { resolve } from "node:path";
import { MacAppController } from "./macos-controller.ts";

const controller = new MacAppController();
const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "launch":
    await controller.launchViaSpotlight(args.join(" ") || undefined);
    console.log("Game launched and focused.");
    break;
  case "focus":
    await controller.focusApp(args.join(" ") || "TOSM TH");
    console.log("Game focused.");
    break;
  case "screenshot": {
    const output = resolve(args[0] ?? "artifacts/tos-screen.png");
    await controller.screenshot(output);
    console.log(output);
    break;
  }
  case "window-screenshot": {
    const output = resolve(args[0] ?? "artifacts/tos-window.png");
    const result = await controller.screenshotWindow(output);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case "click": {
    const x = Number(args[0]);
    const y = Number(args[1]);
    await controller.click({ x, y });
    console.log(`Clicked ${x},${y}.`);
    break;
  }
  case "window-click": {
    const x = Number(args[0]);
    const y = Number(args[1]);
    const imagePath = resolve(args[2] ?? "artifacts/tos-current.png");
    const result = await controller.clickWindowImage({ x, y }, imagePath);
    console.log(JSON.stringify(result, null, 2));
    break;
  }
  case "key": {
    const keyCode = Number(args[0]);
    await controller.pressKey(keyCode, args.slice(1));
    console.log(`Pressed key code ${keyCode}.`);
    break;
  }
  case "doctor": {
    const screenshotPath = resolve(args[0] ?? "artifacts/permission-check.png");
    const permissions = await controller.checkPermissions(screenshotPath);
    console.log(JSON.stringify(permissions, null, 2));
    if (!permissions.accessibility || !permissions.screenRecording) {
      process.exitCode = 2;
    }
    break;
  }
  default:
    console.log(`Usage:
  pnpm tos launch [Spotlight query]
  pnpm tos focus [process name]
  pnpm tos screenshot [output.png]
  pnpm tos window-screenshot [output.png]
  pnpm tos click <x> <y>
  pnpm tos window-click <image-x> <image-y> [source-image.png]
  pnpm tos key <macOS key code> [command|control|option|shift ...]
  pnpm tos doctor [permission-check.png]`);
    process.exitCode = command ? 1 : 0;
}
