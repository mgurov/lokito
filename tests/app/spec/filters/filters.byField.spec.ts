import { expect, test } from "@tests/app/setup/testExtended";
import { FilterEditorPageFixture } from "../../setup/pages/MainPageFixture";

/**
 * TODO: pre-acked & count
 * TODO: different messages different sources?
 * TODO: show on the card
 * TODO: check the validation works ok for the changed field
 * TODO: make possible to switch back to the line thingy from the field
 */
test("should match a message by a field", async ({ mainPage, logs }) => {
  logs.givenRecords(
    // { message: "message 0" }, // preacked
    { message: "m1 root", data: { "field1": "foo", "field2": "other field" } }, // match
    { message: "m2 match", data: { "field1": "fooe" } }, // partial match
    { message: "m3 other", data: { "field1": "baz" } }, // other value
    { message: "m4 missing", data: {} }, // no field
  );

  await mainPage.open();

  await mainPage.expectLogMessages("m4 missing", "m3 other", "m2 match", "m1 root");

  await mainPage.createFilter({
    logLineText: "m1",
    onFirstScreenShown: async (filterEditor: FilterEditorPageFixture) => {
      await filterEditor.selectField("field1");

      await expect(filterEditor.filterRegex).toHaveValue("foo");

      await expect(filterEditor.applyButton).toContainText("Ack 2 matched now");
    },
  });
  await mainPage.expectLogMessages("m4 missing", "m3 other");
});
