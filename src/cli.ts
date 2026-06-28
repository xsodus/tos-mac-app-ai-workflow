import { resolve } from "node:path";
import { MacAppController } from "./macos-controller.ts";
import {
  recordObservation,
  resetObservationLoopTracker,
  type ObservationClassification,
} from "./observation-loop-tracker.ts";

const controller = new MacAppController();
const [command, ...args] = process.argv.slice(2);

switch (command) {
  case "launch":
    if (args.length === 0) {
      throw new TypeError("Usage: pnpm workflow launch <Spotlight query> [process name]");
    }
    await controller.launchViaSpotlight(args[0], args[1] ?? args[0]);
    console.log("App launched and focused.");
    break;
  case "focus":
    if (args.length === 0) {
      throw new TypeError("Usage: pnpm workflow focus <process name>");
    }
    await controller.focusApp(args.join(" "));
    console.log("App focused.");
    break;
  case "screenshot": {
    const output = resolve(args[0] ?? "artifacts/desktop-screen.png");
    await controller.screenshot(output);
    console.log(output);
    break;
  }
  case "window-screenshot": {
    const output = resolve(
      args.length >= 2 ? args[0] : "artifacts/current-window.png",
    );
    const processName = args.length >= 2 ? args.slice(1).join(" ") : args[0];
    if (!processName) {
      throw new TypeError(
        "Usage: pnpm workflow window-screenshot [output.png] <process name>",
      );
    }
    const result = await controller.screenshotWindow(output, processName);
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
    const imagePath = resolve(
      args.length >= 4 ? args[2] : "artifacts/current-window.png",
    );
    const processName = args.length >= 4 ? args.slice(3).join(" ") : args[2];
    if (!processName) {
      throw new TypeError(
        "Usage: pnpm workflow window-click <image-x> <image-y> [source-image.png] <process name>",
      );
    }
    const result = await controller.clickWindowImage({ x, y }, imagePath, processName);
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
  case "loop-reset": {
    const statePath = resolve(args[0] ?? "artifacts/observation-loop-state.json");
    console.log(JSON.stringify(await resetObservationLoopTracker(statePath), null, 2));
    break;
  }
  case "loop-observe": {
    const classification = args[0] as ObservationClassification;
    if (classification !== "idle" && classification !== "activity") {
      throw new TypeError("Classification must be idle or activity.");
    }
    const screenshotPath = resolve(args[1] ?? "artifacts/current-window.png");
    const statePath = resolve(args[2] ?? "artifacts/observation-loop-state.json");
    console.log(
      JSON.stringify(
        await recordObservation(classification, screenshotPath, statePath),
        null,
        2,
      ),
    );
    break;
  }
  default:
    console.log(`Usage:
  pnpm workflow launch <Spotlight query> [process name]
  pnpm workflow focus <process name>
  pnpm workflow screenshot [output.png]
  pnpm workflow window-screenshot [output.png] <process name>
  pnpm workflow click <x> <y>
  pnpm workflow window-click <image-x> <image-y> [source-image.png] <process name>
  pnpm workflow key <macOS key code> [command|control|option|shift ...]
  pnpm workflow doctor [permission-check.png]
  pnpm workflow loop-reset [state.json]
  pnpm workflow loop-observe <idle|activity> [screenshot.png] [state.json]`);
    process.exitCode = command ? 1 : 0;
}
