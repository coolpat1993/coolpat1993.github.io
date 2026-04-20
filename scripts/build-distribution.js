const fs = require("node:fs/promises");
const path = require("node:path");
const esbuild = require("esbuild");
const JavaScriptObfuscator = require("javascript-obfuscator");

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.85,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  splitStrings: true,
  splitStringsChunkLength: 5,
  transformObjectKeys: true,
  renameGlobals: false,
  renameProperties: false,
  selfDefending: true,
  unicodeEscapeSequence: false,
};

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "distribution");

const topLevelFilesToCopy = ["index.html", "style.css"];
const assetsSourceDir = path.join(projectRoot, "assets");

async function ensureDir(dirPath) {
  await fs.mkdir(dirPath, { recursive: true });
}

async function removeDirIfExists(dirPath) {
  await fs.rm(dirPath, { recursive: true, force: true });
}

async function copyFileIntoDistribution(relativePath) {
  const sourcePath = path.join(projectRoot, relativePath);
  const targetPath = path.join(outputDir, relativePath);
  await ensureDir(path.dirname(targetPath));
  await fs.copyFile(sourcePath, targetPath);
}

async function copyDirectoryRecursively(sourceDir, targetDir) {
  await ensureDir(targetDir);
  const entries = await fs.readdir(sourceDir, { withFileTypes: true });

  for (const entry of entries) {
    const sourcePath = path.join(sourceDir, entry.name);
    const targetPath = path.join(targetDir, entry.name);

    if (entry.isDirectory()) {
      await copyDirectoryRecursively(sourcePath, targetPath);
      continue;
    }

    await fs.copyFile(sourcePath, targetPath);
  }
}

async function bundleJavaScript() {
  const bundlePath = path.join(outputDir, "bundle.js");

  await esbuild.build({
    entryPoints: [path.join(projectRoot, "app.js")],
    bundle: true,
    minify: true,
    outfile: bundlePath,
    platform: "browser",
    format: "iife",
  });

  const bundled = await fs.readFile(bundlePath, "utf8");
  const obfuscated = JavaScriptObfuscator.obfuscate(bundled, obfuscationOptions).getObfuscatedCode();
  await fs.writeFile(bundlePath, obfuscated, "utf8");
}

async function buildDistribution() {
  await removeDirIfExists(outputDir);
  await ensureDir(outputDir);

  for (const relativePath of topLevelFilesToCopy) {
    await copyFileIntoDistribution(relativePath);
  }

  await bundleJavaScript();

  // Update index.html in distribution to reference bundle.js instead of app.js
  const htmlPath = path.join(outputDir, "index.html");
  let html = await fs.readFile(htmlPath, "utf8");
  html = html.replace(
    '<script type="module" src="./app.js"></script>',
    '<script src="./bundle.js"></script>'
  );
  await fs.writeFile(htmlPath, html, "utf8");

  await copyDirectoryRecursively(assetsSourceDir, path.join(outputDir, "assets"));

  console.log("Distribution build complete.");
  console.log(`Output: ${outputDir}`);
}

buildDistribution().catch((error) => {
  console.error("Distribution build failed.");
  console.error(error);
  process.exitCode = 1;
});
