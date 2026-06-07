import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export function createCommandRunner() {
  return async function run(command, args, options = {}) {
    const { stdout } = await execFileAsync(command, args, {
      timeout: options.timeoutMs ?? 5000,
      maxBuffer: options.maxBuffer ?? 1024 * 1024,
    });
    return stdout;
  };
}
