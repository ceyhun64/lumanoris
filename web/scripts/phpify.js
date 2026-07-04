const start = process.hrtime.bigint();

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname, "..", "out");
const phpSrc = path.join(__dirname, "..", "src", "php");

async function copyRecursive(src, dest) {
  const stat = await fs.promises.lstat(src);
  if (stat.isDirectory()) {
    await fs.promises.mkdir(dest, { recursive: true });
    const entries = await fs.promises.readdir(src);
    await Promise.all(
      entries.map((name) =>
        copyRecursive(path.join(src, name), path.join(dest, name))
      )
    );
  } else if (stat.isSymbolicLink()) {
    const link = await fs.promises.readlink(src);
    try { await fs.promises.unlink(dest); } catch {}
    await fs.promises.symlink(link, dest);
  } else {
    await fs.promises.copyFile(src, dest);
  }
}

(async () => {
  try {
    await copyRecursive(phpSrc, outDir);
    const end = process.hrtime.bigint();
    const durationS = Number(end - start) / 1e9;
    console.log(`✅ src/php → out kopyalandı. ${durationS.toFixed(2)} s`);
  } catch (err) {
    console.error("❌ phpify hata:", err);
    process.exit(1);
  }
})();
