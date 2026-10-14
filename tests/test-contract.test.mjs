import test from "node:test";
import assert from "node:assert/strict";
import { contractErrors, obligations } from "../scripts/test-contract.mjs";
import { verifyEvidence } from "../scripts/contract-evidence.mjs";
const component = {
  id: "button",
  export: "Button",
  testing: {
    profile: "control",
    target: ".m-button",
    probe: "button",
    states: ["disabled"],
  },
};
test("interactive profile rejects prose, downgrade and unregistered probe", () => {
  assert.deepEqual(contractErrors(component), []);
  for (const patch of [
    { profile: "display" },
    { probe: "tested manually" },
    { states: ["Keyboard and focus"] },
    { target: "body" },
    { states: ["disabled", "disabled"] },
  ])
    assert.ok(
      contractErrors({
        ...component,
        testing: { ...component.testing, ...patch },
      }).length,
    );
});
test("complete execution evidence is required; skipped, missing, duplicate and partial records fail", () => {
  const records = ["light", "dark"].map((theme) => ({
    component: "button",
    theme,
    status: "passed",
    obligations: obligations(component).filter((o) => !o.startsWith("state:")),
  }));
  records.push({
    component: "button",
    state: "disabled",
    status: "passed",
    obligations: ["state:disabled"],
  });
  assert.deepEqual(verifyEvidence([component], records), []);
  assert.ok(verifyEvidence([component], records.slice(1)).length);
  assert.ok(verifyEvidence([component], [...records, records[0]]).length);
  assert.ok(
    verifyEvidence(
      [component],
      records.map((r) => ({ ...r, status: "skipped" })),
    ).length,
  );
  assert.ok(
    verifyEvidence(
      [component],
      records.map((r) => ({ ...r, obligations: [] })),
    ).length,
  );
});
