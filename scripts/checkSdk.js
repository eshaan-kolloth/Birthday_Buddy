// Runs before `npm start`. Warns (never fails) when this project's Expo SDK is
// behind the latest release.
//
// Why it matters: Expo Go on iOS auto-updates through the App Store and can only
// open the LATEST SDK. The moment Expo ships a new SDK, a project that has not
// upgraded stops opening in Expo Go ("Project is incompatible with this version
// of Expo Go"). Seeing this warning early turns that into a planned upgrade.

const pkg = require("../package.json");

const major = (version) =>
  parseInt(String(version).replace(/[^0-9.]/g, "").split(".")[0], 10);

async function main() {
  const current = major(pkg.dependencies.expo);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  let latestVersion;
  try {
    const response = await fetch("https://registry.npmjs.org/expo/latest", {
      signal: controller.signal,
    });
    if (!response.ok) return;
    latestVersion = (await response.json()).version;
  } finally {
    clearTimeout(timer);
  }

  const latest = major(latestVersion);
  if (!(latest > current)) return;

  const line = "─".repeat(66);
  console.warn(`\n${line}`);
  console.warn(`  Expo SDK ${latest} is out; this project is on SDK ${current}.`);
  console.warn("  Expo Go on iOS only opens the latest SDK, so it will refuse");
  console.warn("  this project until you upgrade:");
  console.warn("");
  console.warn("    npx expo install expo@latest --fix");
  console.warn("");
  console.warn("  Or stop depending on Expo Go: use a development build");
  console.warn("  (npm run dev) — see 'Keeping up with Expo SDK releases'.");
  console.warn(`${line}\n`);
}

// A network problem must never block starting the dev server.
main().catch(() => {});
