import { RuleDialog } from "@/components/rule-editor";

const highMessage = "abcdefg\n".repeat(100);
export default function TestRuleEditor() {
  return (
    <>
      <RuleDialog logLine={highMessage} onSubmit={() => {}} />
    </>
  );
}
