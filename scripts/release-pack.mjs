// Parses the output of `npm pack --json`. release.mjs runs pack with --ignore-scripts so
// prepack (the build) cannot write to stdout ahead of the JSON array; this parser is strict
// on purpose and throws a SyntaxError on any leading noise.
export function parsePackOutput(stdout) {
  const packed = JSON.parse(stdout);
  if (!Array.isArray(packed) || typeof packed[0]?.filename !== "string")
    throw Error("npm pack --json did not report a packed archive.");
  return packed[0];
}
