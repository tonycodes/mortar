import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

export function unexpectedChanges(porcelain) {
  throw new Error("not implemented (R-AR stub)");
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(resolve(process.argv[1])).href
) {
  throw new Error("not implemented (R-AR stub)");
}
