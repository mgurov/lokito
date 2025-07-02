import { expect, test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../setup/AppStateFixture";
import { FilterEditorPageFixture } from "../setup/pages/MainPageFixture";

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

test("a non-saved filter should be applied to existing but not following messages ", async ({ page, mainPage, logs }) => {
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
    customActions: async (filterEditor: FilterEditorPageFixture) => {
      await filterEditor.descriptionTextEditor.fill("This is a somewhat explanation");
      await filterEditor.autoAckCheckbox.click();
    },
  });

  await expect(page.getByText("This is a somewhat explanation")).toBeVisible();
});
