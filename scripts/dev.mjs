import { spawn } from "node:child_process";
const args = process.argv.slice(2).filter((v) => v !== "--strictPort");
const child = spawn(
  process.execPath,
  ["node_modules/@angular/cli/bin/ng.js", "serve", ...args],
  { stdio: "inherit" },
);
for (const signal of ["SIGTERM", "SIGINT"])
  process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 1));
