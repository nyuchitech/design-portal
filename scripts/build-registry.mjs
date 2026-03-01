import { execSync } from "child_process";

try {
  console.log("Running shadcn build...");
  const result = execSync("npx shadcn@latest build", {
    cwd: "/vercel/share/v0-project",
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
    timeout: 120000,
  });
  console.log("Build output:", result);
} catch (error) {
  console.error("Build stderr:", error.stderr);
  console.error("Build stdout:", error.stdout);
  console.error("Error:", error.message);
}
