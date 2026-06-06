import { existsSync, renameSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const root = process.cwd();
const apiDir = join(root, "app", "api");
const disabledApiDir = join(root, ".api-disabled-for-pages");

if (existsSync(disabledApiDir)) {
  throw new Error("Found an old .api-disabled-for-pages directory. Restore or remove it before building.");
}

process.env.GITHUB_PAGES = "true";
process.env.NEXT_PUBLIC_BASE_PATH = "/xiao-xiao-wardrobe";

try {
  if (existsSync(apiDir)) {
    renameSync(apiDir, disabledApiDir);
  }

  const result = spawnSync("npx", ["next", "build"], {
    cwd: root,
    env: process.env,
    shell: true,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
  }
} finally {
  if (existsSync(disabledApiDir)) {
    renameSync(disabledApiDir, apiDir);
  }
}
