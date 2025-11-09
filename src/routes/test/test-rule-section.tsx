import { RuleEditSection } from "@/components/rule/rule-editor";

const highMessage = "abcdefg\n".repeat(100) + "and now a long line".repeat(20) + "...";
export default function TestRuleEditor() {
  return (
    <>
      <div>
        <RuleEditSection
          logRecord={{
            sourceLine: highMessage,
            fieldsData: { highMessage, otherField: "short value" },
          }}
          onSubmit={() => {}}
        />
      </div>
    </>
  );
}
