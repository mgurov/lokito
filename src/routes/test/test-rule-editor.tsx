import { RuleDialogButton } from "@/components/rule-editor";

const highMessage =  "abcdefg\n".repeat(100);
export default function() {
    return  (<>
        <RuleDialogButton logLine={highMessage} handleSubmit={() => {}} />
        </>
    );
}