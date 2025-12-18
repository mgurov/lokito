import { expect, test } from "@tests/app/setup/testExtended";
import { FilterEditorPageFixture } from "../../setup/pages/MainPageFixture";

test("should match a message by a field", async ({ mainPage, logs }) => {
  logs.givenRecords(
    { message: "m1 root", data: { "field1": "foo", "field2": "other field" } }, // match
    { message: "m2 match", data: { "field1": "fooe" } }, // partial match
    { message: "m3 other", data: { "field1": "baz" } }, // other value
    { message: "m4 missing", data: {} }, // no field
  );

  await mainPage.open();

  await mainPage.expectLogMessagesRev("m1 root", "m2 match", "m3 other", "m4 missing");

  await mainPage.createFilter({
    logLineText: "m1",
    onFirstScreenShown: async (filterEditor: FilterEditorPageFixture) => {
      await filterEditor.selectField("field1");

      await expect(filterEditor.filterRegex).toHaveValue("foo");

      await filterEditor.expectMatchIndicators({ toAck: 2, ofTotal: 4 });
    },
  });
  await mainPage.expectLogMessagesRev("m3 other", "m4 missing");
  const filtersPage = await mainPage.openFiltersPage();
  const card = filtersPage.getFilterCard({ regex: "foo" });
  await expect(card.locator).toContainText("field1");
});

test("should include matched show match count on creation", async ({ mainPage, logs, appState }) => {
  await appState.givenFilters("preacked");

  logs.givenRecords(
    { message: "preacked", data: { "field1": "foo" } },
    { message: "start here", data: { "field1": "foo", "field2": "other field" } }, // match
    { message: "another match", data: { "field1": "foo" } }, // partial match
    { message: "unrelated" }, // other value
  );

  await mainPage.open();

  await mainPage.expectLogMessagesRev("start here", "another match", "unrelated");

  await mainPage.createFilter({
    logLineText: "start here",
    onFirstScreenShown: async (filterEditor: FilterEditorPageFixture) => {
      await filterEditor.selectField("field1");

      await expect(filterEditor.filterRegex).toHaveValue("foo");

      await filterEditor.expectMatchIndicators({ toAck: 2, ofTotal: 3 });
    },
  });
  await mainPage.expectLogMessages("unrelated");
});

test("field selector should full text-search on both field name and value", async ({ mainPage, logs }) => {
  logs.givenRecords(
    {
      message: "message line",
      data: {
        "abc_field": "foo",
        "def_field": "baz",
      },
    },
  );

  await mainPage.open();

  const filterEditor = await mainPage.createFilter({
    logLineText: "message line",
    saveAction: "none",
  });

  await filterEditor.fieldSelectorTrigger.click();

  await filterEditor.locator.page().getByTestId("field-selector-search-input").fill("def");
  await expect(filterEditor.fieldOption("abc_field")).not.toBeVisible();
  await expect(filterEditor.fieldOption("def_field")).toBeVisible();

  await filterEditor.locator.page().getByTestId("field-selector-search-input").fill("abc");
  await expect(filterEditor.fieldOption("abc_field")).toBeVisible();
  await expect(filterEditor.fieldOption("def_field")).not.toBeVisible();
});

test("field selection match should be reflected at the window", async ({ mainPage, logs }) => {
  logs.givenRecords(
    {
      message: "message line",
      data: {
        "field1": "foo",
        "field2": "baz",
      },
    },
  );

  await mainPage.open();

  const filterEditor = await mainPage.createFilter({
    logLineText: "message line",
    saveAction: "none",
  });

  await filterEditor.selectField("field1");
  await expect(filterEditor.filterRegex).toHaveValue("foo");
  await expect(filterEditor.persistButton).toBeEnabled();

  await filterEditor.filterRegex.fill("faa");
  await expect(filterEditor.persistButton).toBeDisabled();

  await filterEditor.selectField("field2");
  await expect(filterEditor.filterRegex).toHaveValue("baz");
  await expect(filterEditor.persistButton).toBeEnabled();

  // and then back to to the message
  await filterEditor.selectMessageField();
  await expect(filterEditor.filterRegex).toHaveValue("message line");
  await expect(filterEditor.persistButton).toBeEnabled();

  await filterEditor.applyButton.click();
  await mainPage.expectNoLogMessages();
});
