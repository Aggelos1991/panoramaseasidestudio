// 3D room tours: Gaussian-splat scenes shown with PlayCanvas's SuperSplat viewer, which is
// self-hosted under /tour-viewer (copied from node_modules by scripts/copy-tour-viewer.mjs).
// Server-only (reads public/ to find per-tour settings).
import { existsSync } from "node:fs";
import path from "node:path";

const VIEWER_PATH = "/tour-viewer/index.html";

// Scene formats the viewer loads (.ply also covers .compressed.ply).
const TOUR_EXTENSIONS = [".sog", ".ply", ".spz", ".meta.json", ".lod-meta.json"];

// Remote hosts the viewer's CSP lets it fetch scenes from — keep in sync with next.config.ts.
const TOUR_HOSTS = ["res.cloudinary.com"];

// Attribution for licensed sample scenes (CC BY requires crediting the author).
const TOUR_CREDITS: Record<string, string> = {
  "/tours/sample-apartment.sog": "3D scan: Stephane Agullo (sa3d.fr) · CC BY 4.0",
};

// Viewer UI languages we can use; it has no Greek, so el falls back to English.
const VIEWER_LANGS = ["en", "de"];

export function parseTourUrl(value: unknown): { tourUrl: string | null } | { error: string } {
  if (value === null || value === undefined) return { tourUrl: null };
  if (typeof value !== "string") return { error: "3D tour URL must be text" };

  const tourUrl = value.trim();
  if (!tourUrl) return { tourUrl: null };
  if (tourUrl.length > 512) return { error: "3D tour URL is too long" };

  let pathname: string;
  if (tourUrl.startsWith("/") && !tourUrl.startsWith("//")) {
    pathname = new URL(tourUrl, "http://localhost").pathname;
  } else {
    let parsed: URL;
    try {
      parsed = new URL(tourUrl);
    } catch {
      return { error: "3D tour URL is not a valid URL" };
    }
    if (parsed.protocol !== "https:" || !TOUR_HOSTS.includes(parsed.hostname)) {
      return { error: `3D tour must be a /tours/... path or hosted on ${TOUR_HOSTS.join(", ")}` };
    }
    pathname = parsed.pathname;
  }

  if (!TOUR_EXTENSIONS.some((ext) => pathname.toLowerCase().endsWith(ext))) {
    return { error: "3D tour file must be a .sog, .ply, .spz or .meta.json scene" };
  }
  return { tourUrl };
}

// Camera start pose, fly-through and look for a scene, exported from SuperSplat as
// `<scene>.settings.json` next to a local `/tours/<scene>.sog`. Without one the viewer's
// generic defaults apply.
export function tourSettingsUrl(tourUrl: string): string | undefined {
  if (!tourUrl.startsWith("/") || tourUrl.startsWith("//")) return undefined;
  const settingsUrl = tourUrl.replace(/(\.compressed\.ply|\.lod-meta\.json|\.meta\.json|\.[a-z]+)$/i, ".settings.json");
  const file = path.join(process.cwd(), "public", path.normalize(settingsUrl));
  return file.startsWith(path.join(process.cwd(), "public")) && existsSync(file) ? settingsUrl : undefined;
}

export function tourViewerSrc(tourUrl: string, locale: string, posterUrl?: string) {
  const params = new URLSearchParams({
    content: tourUrl,
    lang: VIEWER_LANGS.includes(locale) ? locale : "en",
  });
  const settingsUrl = tourSettingsUrl(tourUrl);
  if (settingsUrl) params.set("settings", settingsUrl);
  if (posterUrl) params.set("poster", posterUrl);
  return `${VIEWER_PATH}?${params}`;
}

export function tourCredit(tourUrl: string): string | undefined {
  return TOUR_CREDITS[tourUrl];
}
