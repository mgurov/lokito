import { expect, test } from "@tests/app/setup/testExtended";

test("non-acking filter on it", async ({ page, mainPage, logs }) => {
  await mainPage.clock.install();
  logs.givenRecords("stem 1", "stem 2", "unrelated");

  await mainPage.open();

  await mainPage.createFilter({
    logLineText: "stem 1",
    filterRegex: "stem",
    customActions: async (d) => {
      await d.autoAckCheckbox.click(); // to uncheck
    },
  });

  // then initially the message is still visible
  await mainPage.expectLogMessages("unrelated", "stem 2", "stem 1");
  await mainPage.expectAckMessages(0);

  // but it is possible to ack all messages matching the filter
  await expect(mainPage.matchingFilterButtons).toHaveCount(2);
  await mainPage.matchingFilterButtons.first().click();
  // then
  await mainPage.expectLogMessages("unrelated");
  await mainPage.expectAckMessages(2);

  await test.step("new incoming messages should also be retained", async () => {
    logs.givenRecords("stem 3", "unrelated 2");
    await page.clock.runFor("01:30");

    await mainPage.expectLogMessages("unrelated 2", "stem 3", "unrelated");
    await mainPage.expectAckMessages(2);
    await expect(mainPage.matchingFilterButtons).toHaveCount(1);
  });
});

test("multiple non-acking filters should both match and display", async ({ mainPage, logs }) => {
  await mainPage.clock.install();
  logs.givenRecords("baz fooe");

  await mainPage.open();

  await mainPage.expectLogMessages("baz fooe");

  await expect(mainPage.matchingFilterButtons).toHaveCount(0);

  // first filter
  await mainPage.createFilter({
    logLineText: "baz fooe",
    filterRegex: "baz",
    customActions: async (d) => {
      await d.autoAckCheckbox.click();
    },
  });
  await expect(mainPage.matchingFilterButtons).toHaveCount(1);

  // second filter
  await mainPage.createFilter({
    logLineText: undefined,
    filterRegex: "fooe",
    customActions: async (d) => {
      await d.autoAckCheckbox.click();
    },
  });
  await expect(mainPage.matchingFilterButtons).toHaveCount(2);

  // now new record matching both filters arrive

  logs.givenRecords("fooe baz");

  await mainPage.waitNextSyncCycle();

  await mainPage.expectLogMessages("fooe baz", "baz fooe");
  await expect(mainPage.matchingFilterButtons).toHaveCount(4);
  // TODO: give filters names
});

test("when multiple rules match if theres an acking one it should not be saturated nonacking", async ({ mainPage, logs }) => {
  await mainPage.clock.install();
  logs.givenRecords("baz fooe");

  await mainPage.open();

  await mainPage.expectLogMessages("baz fooe");

  await expect(mainPage.matchingFilterButtons).toHaveCount(0);

  // first filter
  await mainPage.createFilter({
    logLineText: "baz fooe",
    filterRegex: "baz",
    customActions: async (d) => {
      await d.autoAckCheckbox.click(); // nonacking
    },
  });
  await expect(mainPage.matchingFilterButtons).toHaveCount(1);

  // second filter
  await mainPage.createFilter({
    logLineText: undefined,
    filterRegex: "fooe",
    // acking
  });
  await mainPage.expectLogMessages(...[]);

  // now new record matching both filters arrive

  logs.givenRecords("fooe baz");

  await mainPage.waitNextSyncCycle();

  await mainPage.expectLogMessages(...[]);
});

test("non-acking filter persisted", async ({ appState, mainPage, logs }) => {
  await appState.givenFilters({ messageRegex: "stem", autoAck: false });
  logs.givenRecords("stem 1", "stem 2", "unrelated");

  await mainPage.open();

  // then initially the message is still visible
  await mainPage.expectLogMessages("unrelated", "stem 2", "stem 1");
  await mainPage.expectAckMessages(0);
});

test("should be possible to define a date for which a filter would be auto-acked", async ({ page, mainPage, logs }) => {
  await page.clock.install({ time: "2025-05-12T08:27:01Z" });
  logs.givenRecords(
    { message: "stem 1", timestamp: "2025-05-20T08:27:01Z" },
    { message: "stem 2", timestamp: "2025-05-21T08:27:01Z" },
    { message: "stem 3", timestamp: "2025-05-22T08:27:01Z" },
  );

  await mainPage.open();

  await mainPage.createFilter({
    logLineText: "stem 1",
    filterRegex: "stem",
    customActions: async (filterEditor) => {
      await filterEditor.pickTTLDate("2025-05-22");
    },
  });

  await mainPage.expectLogMessages("stem 3");
  await mainPage.expectAckMessages(2);
  await expect(mainPage.matchingFilterButtons).toHaveCount(1);
});

test("a filter with a date should be autoapplied to the new messages", async ({ appState, mainPage, logs }) => {
  await appState.givenFilters({ messageRegex: "stem", autoAckTillDate: "2025-05-22" });
  logs.givenRecords(
    { message: "stem 1", timestamp: "2025-05-20T08:27:01Z" },
    { message: "stem 2", timestamp: "2025-05-21T08:27:01Z" },
    { message: "stem 3", timestamp: "2025-05-22T08:27:01Z" },
  );

  await mainPage.open();

  await mainPage.expectLogMessages("stem 3");

  await mainPage.expectAckMessages(2);
  await expect(mainPage.matchingFilterButtons).toHaveCount(1);
});

test("only future dates should be available for selection", async ({ page, mainPage, logs }) => {
  await page.clock.install({ time: "2025-05-12T08:27:01Z" });
  logs.givenRecords({ message: "stem 1", timestamp: "2025-05-20T08:27:01Z" });

  await mainPage.open();

  const filterEditor = await mainPage.createFilter({
    logLineText: "stem 1",
    saveAction: "none",
  });

  await filterEditor.autoAckTtlTriggerButton.click();
  await expect(filterEditor.calendarDateButton("2025-05-11")).toBeDisabled();
});
