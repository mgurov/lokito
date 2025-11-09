import { expect, test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../../setup/AppStateFixture";
import { FilterEditorPageFixture } from "../../setup/pages/MainPageFixture";

/**
 * TODO: pre-acked & count
 * TODO: different messages different sources?
 * TODO: show on the card
 * TODO: check the validation works ok for the changed field
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

      // TODO: check preselected valuje foo

      await filterEditor.filterRegex.fill("foo");
      await expect(filterEditor.applyButton).toContainText("Ack 2 matched now");
    },
  });
  await mainPage.expectLogMessages("m4 missing", "m3 other");
});

test("find a line create a filter on it", async ({ page, mainPage, logs }) => {
  logs.givenRecords({ message: "Some<thing> 👻 (H)appened" });

  await mainPage.open();

  await mainPage.createFilter({
    logLineText: "Some<thing> 👻 (H)appened",
  });

  await expect(page.getByText("Some<thing> 👻 (H)appened")).not.toBeVisible();
  await mainPage.expectAckMessages(1);
  await expect(mainPage.cleanBacklogMessage).toBeVisible();
});

// TODO: remove all the below.

test("should show a match count for unacked when doing the regex", async ({ mainPage, logs, appState }) => {
  await appState.givenFilters("message 0");

  logs.givenRecords(
    { message: "message 0" }, // preacked
    { message: "message 1" },
    { message: "message 2" },
    { message: "something 3" }, // won't match
  );

  await mainPage.open();

  await mainPage.expectLogMessages("something 3", "message 2", "message 1");

  await mainPage.createFilter({
    logLineText: "message 1",
    filterRegex: "unmatched",
    onFirstScreenShown: async (filterEditor: FilterEditorPageFixture) => {
      await expect(filterEditor.applyButton).toBeDisabled();

      await test.step("narrow regex", async () => {
        await filterEditor.filterRegex.fill("message 1");
        await expect(filterEditor.applyButton).toBeEnabled();
        await expect(filterEditor.applyButton).toContainText("Ack 1 matched now");
      });

      await test.step("invalid regex", async () => {
        await filterEditor.filterRegex.fill("message(");
        await expect(filterEditor.applyButton).toBeDisabled();
        await expect(filterEditor.applyButton).toContainText("Nothing matched");
      });

      await test.step("broader regex", async () => {
        await filterEditor.filterRegex.fill("message");
        await expect(filterEditor.applyButton).toContainText("Ack 2 matched now (of 3)");
      });
    },
  });
  await mainPage.expectLogMessages("something 3");
});

test(
  "the match count for unacked should include match on other source",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, logs, appState }) => {
    const [s1, s2] = await appState.givenSources({ name: "s1" }, { name: "s2" });

    const sameTimestamp = "2025-02-04T20:00:00.000Z";
    const sameData = { "event": "event1" };

    logs.givenSourceRecords(s1, { message: "s1 event1", timestamp: sameTimestamp, data: sameData });
    // message can be formatted differently different sources
    logs.givenSourceRecords(
      s2,
      { message: "s2 event1", timestamp: sameTimestamp, data: sameData }, // same event appeared from other datasource
      { message: "s2 event2" },
    );

    await appState.givenFilters("s1 event");

    await mainPage.open();

    await mainPage.expectLogMessages("s2 event2");

    await mainPage.createFilter({
      logLineText: "s2 event2",
      filterRegex: "s2 event",
      saveAction: "apply",
      onFirstScreenShown: async (filterEditor: FilterEditorPageFixture) => {
        await expect(filterEditor.applyButton).toContainText("Ack 1 matched now (of 2)");
      },
    });
  },
);

test("a saved filter should be applied to existing and following messages ", async ({ page, mainPage, logs }) => {
  await page.clock.install();
  logs.givenRecords("this_message", "unrelated 1");

  await mainPage.open();

  await mainPage.expectLogMessages("unrelated 1", "this_message");

  await mainPage.createFilter({
    logLineText: "this_message",
  });

  await mainPage.expectLogMessages("unrelated 1");
  await mainPage.expectAckMessages(1);

  // two more new messages should be captured
  logs.givenRecords("this_message 2", "unrelated 2", "this_message 3");

  await page.clock.runFor("01:30");

  await mainPage.expectLogMessages("unrelated 2", "unrelated 1");
  await mainPage.expectAckMessages(3);
});

test("should be able to see messages acked by a filter", async ({ appState, mainPage, logs }) => {
  await appState.givenFilters("1");

  logs.givenRecords("m 1", "m 2");

  await mainPage.open();

  await mainPage.expectLogMessages("m 2");
  await mainPage.expectAckMessages(1);

  await mainPage.ackedMessagesCount.click();
  await mainPage.expectLogMessages("m 1");
});

test("a non-saved transient filter should be applied to existing but not following messages ", async ({ page, mainPage, logs }) => {
  await page.clock.install();

  logs.givenRecords("this_message", "unrelated 1");

  await mainPage.open();

  await mainPage.expectLogMessages("unrelated 1", "this_message");

  await mainPage.createFilter({
    logLineText: "this_message",
    saveAction: "apply",
  });

  await mainPage.expectLogMessages("unrelated 1");
  await mainPage.expectAckMessages(1);

  // new messages should NOT be captured
  logs.givenRecords("this_message 2", "unrelated 2");

  await page.clock.runFor("01:30");

  await mainPage.expectLogMessages("unrelated 2", "this_message 2", "unrelated 1");
  await mainPage.expectAckMessages(1);
});

test(
  "same message should show use first line from all and respective from source tab on filter creation",
  AnnotationSuppressDefaultApp,
  async ({ page, mainPage, appState, logs }) => {
    test.slow();

    const [s1, s2] = await appState.givenSources({ name: "s1" }, { name: "s2" });

    const sameTimestamp = "2025-02-04T20:00:00.000Z";
    const sameData = { "event": "event1" };

    logs.givenSourceRecords(s1, { message: "s1 event1", timestamp: sameTimestamp, data: sameData });
    // NB: message can be formatted differently different sources
    logs.givenSourceRecords(s2, { message: "s2 event1", timestamp: sameTimestamp, data: sameData });

    await mainPage.open();

    await test.step("from main page use the first source message", async () => {
      await mainPage.expandRow("s1 event1");
      await page.getByTestId("new-rule-button").click();
      await expect(page.getByTestId("rule_regex")).toHaveValue("s1 event1");
      await page.getByTestId("close-rule-button").click();
    });

    await test.step("from s1 page use the first source message", async () => {
      await mainPage.selectSourceTab(s1);
      await mainPage.expandRow("s1 event1");
      await page.getByTestId("new-rule-button").click();
      await expect(page.getByTestId("rule_regex")).toHaveValue("s1 event1");
      await page.getByTestId("close-rule-button").click();
    });

    await test.step("from s2 page use the second source message", async () => {
      await mainPage.selectSourceTab(s2);
      await mainPage.expandRow("s2 event1");
      await page.getByTestId("new-rule-button").click();
      await expect(page.getByTestId("rule_regex")).toHaveValue("s2 event1");
      await page.getByTestId("apply-rule-button").click();
    });

    await mainPage.selectAllSourcesTab();
    await mainPage.expectAckMessages(1);
  },
);

test("filter description", async ({ page, mainPage, logs }) => {
  logs.givenRecords({ message: "message1" });

  await mainPage.open();

  await mainPage.createFilter({
    logLineText: "message1",
    onSecondScreenShown: async (filterEditor: FilterEditorPageFixture) => {
      await filterEditor.descriptionTextEditor.fill("This is a somewhat explanation");
      await filterEditor.autoAckCheckbox.click();
    },
  });

  await expect(page.getByTestId("filter-message-description")).toContainText("This is a somewhat explanation");
});

test("should filter multilined messages", async ({ mainPage, logs }) => {
  logs.givenRecords("a\nb_\nc");
  logs.givenRecords("a\nb_\nd");
  logs.givenRecords("a\ne_\nd");

  await mainPage.open();

  await mainPage.expectLogMessages(
    "a\ne_\nd",
    "a\nb_\nd",
    "a\nb_\nc",
  );

  await mainPage.createFilter({
    logLineText: "a\nb_\nc",
    expectedPrefilledRegex: "a\\nb_\\nc",
    filterRegex: "a\\nb",
  });

  await mainPage.expectLogMessages(
    "a\ne_\nd",
  );
});
