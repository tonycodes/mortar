import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { verifyEvidence } from "../../scripts/contract-evidence.mjs";
export default class ContractReporter {
  records = [];
  onTestEnd(test, result) {
    for (const attachment of result.attachments)
      if (attachment.name === "contract-evidence") {
        try {
          this.records.push({
            ...JSON.parse(attachment.body.toString()),
            status: result.status,
          });
        } catch {
          this.records.push({
            component: "invalid",
            obligations: [],
            status: "failed",
          });
        }
      }
  }
  onEnd() {
    if (process.env.MORTAR_CONTRACT_FULL !== "1") return;
    const { components } = JSON.parse(
      readFileSync(new URL("../../catalog.json", import.meta.url), "utf8"),
    );
    const errors = verifyEvidence(components, this.records);
    mkdirSync("test-results", { recursive: true });
    writeFileSync(
      "test-results/component-contract.json",
      JSON.stringify(
        { passed: errors.length === 0, errors, records: this.records },
        null,
        2,
      ),
    );
    if (errors.length) {
      console.error(errors.join("\n"));
      return { status: "failed" };
    }
  }
}
