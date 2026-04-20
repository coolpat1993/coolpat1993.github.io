const fs = require("node:fs/promises");
const path = require("node:path");
const JavaScriptObfuscator = require("javascript-obfuscator");

const projectRoot = path.resolve(__dirname, "..");
const outputDir = path.join(projectRoot, "distribution");

const topLevelFilesToCopy = ["index.html","style.css"];
const topLevelJsToObfuscate = ["app.js"];
const jsSourceDir = path.join(projectRoot, "js");
const assetsSourceDir = path.join(projectRoot, "assets");

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  deadCodeInjection: false,
  stringArray: true,
  stringArrayEncoding: ["base64"],
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false,
  renameGlobals: false
};

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

async function getAllJavaScriptFiles(sourceDir) {
  const files = [];

  async function walk(currentDir) {
    const entries = await fs.readdir(currentDir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        await walk(fullPath);
        continue;
      }

      if (entry.isFile() && entry.name.endsWith(".js")) {
        files.push(fullPath);
      }
    }
  }

  await walk(sourceDir);
  return files;
}

async function obfuscateJavaScriptFile(sourcePath, targetPath) {
  const sourceCode = await fs.readFile(sourcePath, "utf8");
  const obfuscated = JavaScriptObfuscator.obfuscate(sourceCode, obfuscationOptions).getObfuscatedCode();

  await ensureDir(path.dirname(targetPath));
  await fs.writeFile(targetPath, obfuscated, "utf8");
}

async function buildDistribution() {
  await removeDirIfExists(outputDir);
  await ensureDir(outputDir);

  for (const relativePath of topLevelFilesToCopy) {
    await copyFileIntoDistribution(relativePath);
  }

  for (const relativePath of topLevelJsToObfuscate) {
    const sourcePath = path.join(projectRoot, relativePath);
    const targetPath = path.join(outputDir, relativePath);
    await obfuscateJavaScriptFile(sourcePath, targetPath);
  }

  const jsFiles = await getAllJavaScriptFiles(jsSourceDir);
  for (const sourcePath of jsFiles) {
    const relativeFromJsRoot = path.relative(jsSourceDir, sourcePath);
    const targetPath = path.join(outputDir, "js", relativeFromJsRoot);
    await obfuscateJavaScriptFile(sourcePath, targetPath);
  }

  await copyDirectoryRecursively(assetsSourceDir, path.join(outputDir, "assets"));

  console.log("Distribution build complete.");
  console.log(`Output: ${outputDir}`);
}

buildDistribution().catch((error) => {
  console.error("Distribution build failed.");
  console.error(error);
  process.exitCode = 1;
});
