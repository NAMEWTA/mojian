import { spawn } from "node:child_process";

process.env.MOJIAN_DESKTOP = "1";

const child = spawn(
  process.execPath,
  ["scripts/with-app-env.mjs", "vite", "build"],
  { stdio: "inherit", env: process.env },
);

child.on("exit", (code) => process.exit(code ?? 1));
