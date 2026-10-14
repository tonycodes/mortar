import { obligations } from "./test-contract.mjs";
export function verifyEvidence(components, records) {
  const expected = new Map();
  for (const component of components) {
    for (const theme of ["light", "dark"])
      expected.set(
        `${component.id}/${theme}`,
        obligations(component).filter((o) => !o.startsWith("state:")),
      );
    for (const state of component.testing.states)
      expected.set(`${component.id}/state:${state}`, [`state:${state}`]);
  }
  const seen = new Set(),
    errors = [];
  for (const record of records) {
    const key = `${record.component}/${record.state ? `state:${record.state}` : record.theme}`;
    if (seen.has(key)) errors.push(`Duplicate evidence: ${key}`);
    seen.add(key);
    if (!expected.has(key)) errors.push(`Unexpected evidence: ${key}`);
    else if (
      record.status !== "passed" ||
      JSON.stringify([...record.obligations].sort()) !==
        JSON.stringify([...expected.get(key)].sort())
    )
      errors.push(`Incomplete or failed obligations: ${key}`);
  }
  for (const key of expected.keys())
    if (!seen.has(key)) errors.push(`Missing evidence: ${key}`);
  return errors;
}
