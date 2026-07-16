import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for database backup`);
  }

  return value;
};

const getArgValue = (name) => {
  const prefix = `--${name}=`;
  const inlineValue = process.argv.find((arg) => arg.startsWith(prefix));

  if (inlineValue) {
    return inlineValue.slice(prefix.length);
  }

  const index = process.argv.indexOf(`--${name}`);
  return index >= 0 ? process.argv[index + 1] : undefined;
};

const buildMysqlArgs = ({ host, port, user, password }) => {
  const args = [
    `--host=${host}`,
    `--port=${port}`,
    `--user=${user}`,
  ];

  if (password) {
    args.push(`--password=${password}`);
  }

  return args;
};

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");

const dbName = getRequiredEnv("DB_NAME");
const backupDir = path.resolve(getArgValue("dir") || "db/backups");
const outputFile = path.resolve(
  getArgValue("file") || path.join(backupDir, `${dbName}_${timestamp}.sql`),
);

if (!existsSync(path.dirname(outputFile))) {
  mkdirSync(path.dirname(outputFile), { recursive: true });
}

const command = "mysqldump";
const args = [
  ...buildMysqlArgs({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: getRequiredEnv("DB_USER"),
    password: process.env.DB_PASSWORD,
  }),
  "--single-transaction",
  "--routines",
  "--triggers",
  "--set-gtid-purged=OFF",
  dbName,
  `--result-file=${outputFile}`,
];

const redactPassword = (arg) =>
  arg.startsWith("--password=") ? "--password=********" : arg;

console.log([command, ...args.map(redactPassword)]);

const result = spawnSync(command, args, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (result.error) {
  console.error(`Backup failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status === 0) {
  console.log(`Backup successful. File saved as ${outputFile}.`);
} else {
  console.error(`Error: ${result.stderr}`);
  process.exit(result.status || 1);
}
