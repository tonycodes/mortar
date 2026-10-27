import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export function parseCommit(message) {
  throw new Error("not implemented (R-AR stub)");
}

export function latestStableTag(names) {
  throw new Error("not implemented (R-AR stub)");
}

export function nextVersion(version, messages) {
  throw new Error("not implemented (R-AR stub)");
}

export function decideRelease(input) {
  throw new Error("not implemented (R-AR stub)");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  throw new Error("not implemented (R-AR stub)");
}
