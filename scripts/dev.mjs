// Ambiente de desenvolvimento: runtime do player em modo watch + servidor Next.js.
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const run = (args) =>
  spawn(process.execPath, args, { cwd: root, stdio: "inherit" });

const runtime = run([path.join(root, "scripts/build-runtime.mjs"), "--watch"]);
const next = run([path.join(root, "node_modules/next/dist/bin/next"), "dev", ...process.argv.slice(2)]);

const stop = () => {
  runtime.kill();
  next.kill();
  process.exit();
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
next.on("exit", stop);
