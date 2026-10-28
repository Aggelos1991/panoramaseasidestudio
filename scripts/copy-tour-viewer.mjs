// Copies PlayCanvas's SuperSplat viewer (a static build) into public/tour-viewer so room
// pages can embed 3D tours from our own origin. Runs automatically before `dev` and `build`.
import { copyFileSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";
import { defaultSettings } from "@playcanvas/supersplat-viewer/settings";

const root = path.resolve(import.meta.dirname, "..");
const source = path.join(root, "node_modules/@playcanvas/supersplat-viewer/public");
const target = path.join(root, "public/tour-viewer");

rmSync(target, { recursive: true, force: true });
mkdirSync(target, { recursive: true });

for (const file of ["index.html", "index.js", "index.css"]) {
  copyFileSync(path.join(source, file), path.join(target, file));
}

// Fallback camera/look settings; the viewer frames a captured space from inside it.
writeFileSync(
  path.join(target, "settings.json"),
  JSON.stringify(defaultSettings("environment"), null, 2),
);

console.log("tour-viewer: copied SuperSplat viewer to public/tour-viewer");
