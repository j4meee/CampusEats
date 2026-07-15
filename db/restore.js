import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";

dotenv.config();

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for database restore`);
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

const inputArg = getArgValue("file") || process.argv[2];

if (!inputArg) {
  console.error("Usage: npm run db:restore -- --file=db/backups/campuseats_db_backup.sql");
  process.exit(1);
}

const inputFile = path.resolve(inputArg);

if (!existsSync(inputFile)) {
  console.error(`Restore failed: ${inputFile} does not exist.`);
  process.exit(1);
}

const dbName = getRequiredEnv("DB_NAME");
const connectionArgs = buildMysqlArgs({
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 3306,
  user: getRequiredEnv("DB_USER"),
  password: process.env.DB_PASSWORD,
});

const createDatabaseCommand = [
  "CREATE DATABASE IF NOT EXISTS",
  `\`${dbName.replace(/`/g, "``")}\``,
  "CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
].join(" ");

const createResult = spawnSync("mysql", [...connectionArgs, `--execute=${createDatabaseCommand}`], {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

if (createResult.error) {
  console.error(`Restore failed: ${createResult.error.message}`);
  process.exit(1);
}

if (createResult.status !== 0) {
  console.error(`Error creating database: ${createResult.stderr}`);
  process.exit(createResult.status || 1);
}

const command = "mysql";
const args = [...connectionArgs, dbName];

console.log([command, ...args]);

const result = spawnSync(command, args, {
  input: readFileSync(inputFile),
  encoding: "utf8",
  stdio: ["pipe", "pipe", "pipe"],
  maxBuffer: 1024 * 1024 * 100,
});

console.log(result);

if (result.error) {
  console.error(`Restore failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status === 0) {
  console.log(`Restore successful from ${inputFile}.`);
} else {
  console.error(`Error: ${result.stderr}`);
  process.exit(result.status || 1);
}
