import { expect, test } from "@tests/app/setup/testExtended";

test("non-acking filter on it", async ({ page, mainPage, logs }) => {
  await mainPage.clock.install();
  logs.givenRecords("stem 1", "stem 2", "unrelated");

  await mainPage.open();

  await mainPage.createFilter({
    logLineText: "stem 1",
    filterRegex: "stem",
    onSecondScreenShown: async (d) => {
      await d.autoAckCheckbox.click(); // to uncheck
    },
  });

  // then initially the message is still visible
  await mainPage.expectLogMessages("unrelated", "stem 2", "stem 1");
  await mainPage.expectAckMessages(0);

  // but it is possible to ack all messages matching the filter
  await expect(mainPage.matchingFilterButtons).toHaveCount(2);
  await mainPage.matchingFilterButtons.first().click();
  await mainPage.matchingFilterAckSuchDropdownOption.click();
  // then
  await mainPage.expectLogMessages("unrelated");
  await mainPage.expectAckMessages(2);

  await test.step("new incoming messages should also be retained", async () => {
    logs.givenRecords("stem 3", "unrelated 2");
    await page.clock.runFor("01:30");

    await mainPage.expectLogMessages("unrelated 2", "stem 3", "unrelated");
    await mainPage.expectAckMessages(2);
    await expect(mainPage.matchingFilterButtons).toHaveCount(1);
  }, { box: true });
});

test("non-acking filter possible to see all matched", async ({ mainPage, logs, appState }) => {
  await appState.givenFilters({
    messageRegex: "stem",
    autoAck: false,
  });

  logs.givenRecords("stem 1", "stem 2", "unrelated");

  await mainPage.open();

  await mainPage.expectLogMessages("unrelated", "stem 2", "stem 1");

  await expect(mainPage.matchingFilterButtons).toHaveCount(2);
  await mainPage.matchingFilterButtons.first().click();
  await mainPage.matchingFilterShowSuchDropdownOption.click();

  // here we should see the filter card on top
  await expect(mainPage.page.getByTestId("delete-filter-button")).toHaveCount(1);

  await mainPage.expectLogMessages("stem 2", "stem 1");
  // and the filter button isn't needed here anymore
  await expect(mainPage.matchingFilterButtons).toHaveCount(0);

  await test.step("the filter card should also not be present on the expansion of the log line", async () => {
    await mainPage.page.getByText("stem 1").click();
    await expect(mainPage.page.getByTestId("delete-filter-button")).toHaveCount(1);
  });
});

test("non-acking filter page should show acked filters as well", async ({ mainPage, logs, appState }) => {
  await appState.givenFilters({
    messageRegex: "stem",
    autoAck: false,
  }, {
    messageRegex: "unrelated",
    autoAck: false,
  });

  logs.givenRecords("stem 1", "stem 2", "unrelated");

  await mainPage.open();

  await mainPage.expectLogMessages("unrelated", "stem 2", "stem 1");

  await mainPage.ack("stem 1");

  await mainPage.expectLogMessages("unrelated", "stem 2");

  const stemFilterButton = mainPage.logRowByMessage("stem 2").getByTestId("matching-filter");
  await stemFilterButton.click();
  await mainPage.matchingFilterShowSuchDropdownOption.click();

  await mainPage.expectLogMessages("stem 2", "stem 1");

  await mainPage.clickAckAll({ expectedCount: 1 });

  await mainPage.homeLogo.click();

  await mainPage.expectLogMessages("unrelated");
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
    onSecondScreenShown: async (d) => {
      await d.autoAckCheckbox.click();
    },
  });
  await expect(mainPage.matchingFilterButtons).toHaveCount(1);

  // second filter
  await mainPage.createFilter({
    logLineText: undefined,
    filterRegex: "fooe",
    onSecondScreenShown: async (d) => {
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

test("multiple existing non-acking filters should both match and display", async ({ mainPage, logs, appState }) => {
  await mainPage.clock.install();

  await appState.givenFilters({
    messageRegex: "baz",
    autoAck: false,
  }, {
    messageRegex: "fooe",
    autoAck: false,
  });

  logs.givenRecords("baz fooe");

  await mainPage.open();

  await mainPage.expectLogMessages("baz fooe");

  await expect(mainPage.matchingFilterButtons).toHaveCount(2);
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
    onSecondScreenShown: async (d) => {
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
    onSecondScreenShown: async (filterEditor) => {
      await filterEditor.pickTTLDate("2025-05-22");
    },
  });

  await mainPage.expectLogMessages("stem 3");
  await mainPage.expectAckMessages(2);
  await expect(mainPage.matchingFilterButtons).toHaveCount(1);
});

test("ttl should be disabled when the filter is not acking anyways", async ({ mainPage, logs }) => {
  logs.givenRecords("message");

  await mainPage.open();

  await mainPage.createFilter({
    logLineText: "message",
    onSecondScreenShown: async (filterEditor) => {
      await expect(filterEditor.autoAckTtlTriggerButton).toBeEnabled();
      await filterEditor.autoAckCheckbox.click();
      await expect(filterEditor.autoAckTtlTriggerButton).toBeDisabled();
    },
  });
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

test("only future dates should be available for selection", async ({ mainPage, logs }) => {
  await mainPage.clock.install({ time: "2025-05-12T08:27:01Z" });
  logs.givenRecords({ message: "stem 1", timestamp: "2025-05-20T08:27:01Z" });

  await mainPage.open();

  const filterEditor = await mainPage.createFilter({
    logLineText: "stem 1",
    saveAction: "none",
  });

  await filterEditor.persistButton.click();
  await filterEditor.autoAckTtlTriggerButton.click();
  await expect(filterEditor.calendarDateButton("2025-05-11")).toBeDisabled();
});

test("should not reset filter view on logs sync", async ({ mainPage, logs }) => {
  await mainPage.clock.install();
  logs.givenRecords("rec1");

  await mainPage.open();

  const filterEditor = await mainPage.createFilter({
    logLineText: "rec1",
    saveAction: "none",
  });

  await filterEditor.persistButton.click();
  await expect(filterEditor.saveButton).toBeVisible();
  await expect(filterEditor.persistButton).not.toBeVisible();

  await mainPage.waitNextSyncCycle();

  await expect(filterEditor.saveButton).toBeVisible();
  await expect(filterEditor.persistButton).not.toBeVisible();
});

test("should have the filter editor visible on many new logs arrival", async ({ mainPage, logs }) => {
  await mainPage.clock.install();
  logs.givenRecords("rec1");

  await mainPage.open();

  const filterEditor = await mainPage.createFilter({
    logLineText: "rec1",
    saveAction: "none",
  });

  await filterEditor.persistButton.click();
  await expect(filterEditor.saveButton).toBeVisible();
  await expect(filterEditor.persistButton).not.toBeVisible();

  logs.givenRecords(...Array.from({ length: 45 }).map((_, i) => `new_rec_` + i));

  await mainPage.waitNextSyncCycle();

  await expect(mainPage.page.getByText("new_rec_44")).toBeVisible();

  await expect(filterEditor.saveButton).toBeVisible();
  await expect(filterEditor.persistButton).not.toBeVisible();
});
