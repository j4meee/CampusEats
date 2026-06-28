import { spawn } from "node:child_process";

const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const processes = [
  { name: "api", args: ["run", "server"] },
  { name: "web", args: ["run", "dev"] },
];

const children = processes.map(({ name, args }) => {
  const child = spawn(npmCommand, args, {
    stdio: ["inherit", "pipe", "pipe"],
    shell: process.platform === "win32",
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });

  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });

  child.on("exit", (code) => {
    if (code !== 0) {
      console.error(`[${name}] exited with code ${code}`);
      stopAll();
    }
  });

  return child;
});

const stopAll = () => {
  for (const child of children) {
    if (!child.killed) {
      child.kill();
    }
  }
};

process.on("SIGINT", () => {
  stopAll();
  process.exit(0);
});

process.on("SIGTERM", () => {
  stopAll();
  process.exit(0);
});
