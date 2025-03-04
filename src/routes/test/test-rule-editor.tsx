import { RuleDialog } from "@/components/rule-editor";

const highMessage =  "abcdefg\n".repeat(100);
export default function() {
    return  (<>
        <RuleDialog logLine={highMessage} handleSubmit={() => {}} />
        </>
    );
}