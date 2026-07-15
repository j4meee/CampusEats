import { spawnSync } from "node:child_process";
import dotenv from "dotenv";

dotenv.config();

const getRequiredEnv = (name) => {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} is required for granting database privileges`);
  }

  return value;
};

const quoteIdentifier = (value) => `\`${value.replace(/`/g, "``")}\``;
const quoteSqlString = (value) => `'${value.replace(/'/g, "''")}'`;

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

const dbName = getRequiredEnv("DB_NAME");
const managerUser = getRequiredEnv("DB_MANAGER_USER");
const managerPassword = getRequiredEnv("DB_MANAGER_PASSWORD");
const managerHost = process.env.DB_MANAGER_HOST || "localhost";

const adminUser = process.env.DB_ADMIN_USER || process.env.DB_USER;
const adminPassword = process.env.DB_ADMIN_PASSWORD ?? process.env.DB_PASSWORD;

if (!adminUser) {
  throw new Error("DB_ADMIN_USER or DB_USER is required for granting database privileges");
}

const sqlStatements = [
  `CREATE USER IF NOT EXISTS ${quoteSqlString(managerUser)}@${quoteSqlString(managerHost)} IDENTIFIED BY ${quoteSqlString(managerPassword)}`,
  `GRANT ALL PRIVILEGES ON ${quoteIdentifier(dbName)}.* TO ${quoteSqlString(managerUser)}@${quoteSqlString(managerHost)}`,
  "FLUSH PRIVILEGES",
];

const command = "mysql";
const args = [
  ...buildMysqlArgs({
    host: process.env.DB_HOST || "localhost",
    port: Number(process.env.DB_PORT) || 3306,
    user: adminUser,
    password: adminPassword,
  }),
  `--execute=${sqlStatements.join("; ")};`,
];

console.log([command, ...args]);

const result = spawnSync(command, args, {
  encoding: "utf8",
  stdio: ["ignore", "pipe", "pipe"],
});

console.log(result);

if (result.error) {
  console.error(`Grant privileges failed: ${result.error.message}`);
  process.exit(1);
}

if (result.status === 0) {
  console.log(`Granted all privileges on ${dbName}.* to ${managerUser}@${managerHost}.`);
} else {
  console.error(`Error: ${result.stderr}`);
  process.exit(result.status || 1);
}
