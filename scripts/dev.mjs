import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const children = [
  spawn(process.execPath, ["server/index.mjs"], {
    stdio: "inherit"
  }),
  spawn(npmCommand, ["run", "dev:web"], {
    stdio: "inherit"
  })
];

function stopChildren(signal) {
  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

process.on("SIGINT", () => {
  stopChildren("SIGINT");
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopChildren("SIGTERM");
  process.exit(0);
});

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      stopChildren("SIGTERM");
      process.exit(code);
    }
  });
}
