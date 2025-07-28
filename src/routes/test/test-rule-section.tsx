import { RuleEditSection } from "@/components/rule/rule-editor";

const highMessage = "abcdefg\n".repeat(100);
export default function TestRuleEditor() {
  return (
    <>
      <div>
        <RuleEditSection logLine={highMessage} onSubmit={() => {}} />
      </div>
    </>
  );
}
