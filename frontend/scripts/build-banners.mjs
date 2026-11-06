// Renders the Bangla home banner (scripts/banners/bangla.html) to PNG with a headless Edge or Chrome,
// so Bengali conjuncts and vowel signs are shaped by a real browser engine.
//   npm run banners:build
import { execFileSync } from "node:child_process"
import { existsSync, mkdirSync } from "node:fs"
import { dirname, join, resolve } from "node:path"
import { fileURLToPath, pathToFileURL } from "node:url"

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..")
const out = join(root, "public", "banner-art")
const page = join(root, "scripts", "banners", "bangla.html")

const candidates = [
  process.env.BROWSER_PATH,
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "/usr/bin/google-chrome",
  "/usr/bin/chromium",
].filter(Boolean)
const browser = candidates.find((p) => existsSync(p))
if (!browser) {
  console.error("No Edge/Chrome found. Set BROWSER_PATH to its executable.")
  process.exit(1)
}

mkdirSync(out, { recursive: true })
const sizes = [
  { name: "bn-wide.png", size: "wide", w: 2400, h: 750 },
  { name: "bn-phone.png", size: "phone", w: 1200, h: 800 },
]
for (const s of sizes) {
  const file = join(out, s.name)
  execFileSync(
    browser,
    [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=1",
      `--window-size=${s.w},${s.h}`,
      "--virtual-time-budget=20000",
      `--screenshot=${file}`,
      `${pathToFileURL(page).href}?size=${s.size}`,
    ],
    { stdio: "ignore" },
  )
  console.log("wrote", file)
}
