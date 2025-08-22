import { expect, test } from "@tests/app/setup/testExtended";

test("should ack by trace by new filter", async ({ mainPage, logs }) => {
  logs.givenRecords(
    {
      message: "pre-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "trace-acking-filter-stem", // matched by the filter1
      traceId: "trace-1",
    },
    {
      message: "apres-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "unrelated",
      traceId: "trace-2",
    },
  );

  await mainPage.open();

  await mainPage.expectLogMessages(
    "unrelated",
    "apres-trace",
    "trace-acking-filter-stem",
    "pre-trace",
  );

  await mainPage.createFilter({
    logLineText: "trace-acking-filter-stem",
    customActionsFirstScreen: async (d) => {
      await expect(d.ackWholeTraceCheckbox).toBeChecked();
    },
  });

  await mainPage.expectLogMessages("unrelated");
});

test("should ack by trace by transient filter", async ({ mainPage, logs }) => {
  logs.givenRecords(
    {
      message: "pre-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "trace-acking-filter-stem", // matched by the filter1
      traceId: "trace-1",
    },
    {
      message: "apres-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "unrelated",
      traceId: "trace-2",
    },
  );

  await mainPage.open();

  await mainPage.expectLogMessages(
    "unrelated",
    "apres-trace",
    "trace-acking-filter-stem",
    "pre-trace",
  );

  await mainPage.createFilter({
    logLineText: "trace-acking-filter-stem",
    saveAction: "apply",
  });

  await mainPage.expectLogMessages("unrelated");
});

test("should not ack by trace by new filter if check unticked", async ({ mainPage, logs }) => {
  logs.givenRecords(
    {
      message: "pre-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "trace-acking-filter-stem", // matched by the filter1
      traceId: "trace-1",
    },
    {
      message: "apres-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "unrelated",
      traceId: "trace-2",
    },
  );

  await mainPage.open();

  await mainPage.expectLogMessages(
    "unrelated",
    "apres-trace",
    "trace-acking-filter-stem",
    "pre-trace",
  );

  await mainPage.createFilter({
    logLineText: "trace-acking-filter-stem",
    customActionsFirstScreen: async (d) => {
      await d.ackWholeTraceCheckbox.click();
      await expect(d.ackWholeTraceCheckbox).not.toBeChecked();
    },
  });

  await mainPage.expectLogMessages(
    "unrelated",
    "apres-trace",
    "pre-trace",
  );
});

test("should not ack by trace by transient filter if check unticked", async ({ mainPage, logs }) => {
  logs.givenRecords(
    {
      message: "pre-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "trace-acking-filter-stem", // matched by the filter1
      traceId: "trace-1",
    },
    {
      message: "apres-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "unrelated",
      traceId: "trace-2",
    },
  );

  await mainPage.open();

  await mainPage.expectLogMessages(
    "unrelated",
    "apres-trace",
    "trace-acking-filter-stem",
    "pre-trace",
  );

  await mainPage.createFilter({
    logLineText: "trace-acking-filter-stem",
    saveAction: "apply",
    customActionsFirstScreen: async (d) => {
      await d.ackWholeTraceCheckbox.click();
      await expect(d.ackWholeTraceCheckbox).not.toBeChecked();
    },
  });

  await mainPage.expectLogMessages(
    "unrelated",
    "apres-trace",
    "pre-trace",
  );
});

test("should ack by trace by existing filter", async ({ mainPage, logs, appState }) => {
  await appState.givenFilters({
    // filter1
    messageRegex: "ack_trace_stem",
    autoAck: true,
    captureWholeTrace: true,
  }, {
    // filter2
    messageRegex: "leave_unacked_trace_stem",
    autoAck: true,
    captureWholeTrace: false,
  });

  logs.givenRecords(
    {
      message: "unmatched regex after still trace-1", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "ack_trace_stem 1", // matched by the filter1
      traceId: "trace-1",
    },
    {
      message: "unmatched regex before still trace-1", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "leave_unacked_trace_stem 2", // matched by the filter2
      traceId: "trace-2",
    },
    {
      message: "unmatched regex should stay trace-2", // not mached and filter2 doesn't capture the trace
      traceId: "trace-2",
    },
  );

  await mainPage.open();

  await mainPage.expectLogMessages("unmatched regex should stay trace-2");
});

test("ack by trace for non-acking filer should result in affected records seen and acked by that filter", async ({ mainPage, logs, appState }) => {
  await appState.givenFilters({
    messageRegex: "trace-match",
    autoAck: false,
    captureWholeTrace: true,
  });

  logs.givenRecords(
    {
      message: "pre-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "trace-match", // matched by the filter1
      traceId: "trace-1",
    },
    {
      message: "after-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "unrelated",
      traceId: "trace-2",
    },
  );

  await mainPage.open();

  await mainPage.expectLogMessages(
    "unrelated",
    "after-trace",
    "trace-match",
    "pre-trace",
  );

  await test.step("and now ack them all by trace", async () => {
    await mainPage.ackTrace("trace-1");

    await mainPage.expectLogMessages(
      "unrelated",
    );
  });
});

test("should show again the entries after the filter removal", async ({ mainPage, logs, appState }) => {
  const [filter] = await appState.givenFilters({
    messageRegex: "ack-trace-stem",
    autoAck: true,
    captureWholeTrace: true,
  });

  logs.givenRecords(
    {
      message: "pre-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: filter.messageRegex, // matched by the filter1
      traceId: "trace-1",
    },
    {
      message: "apres-trace", // not matched but the trace of the filter1
      traceId: "trace-1",
    },
    {
      message: "unrelated",
      traceId: "trace-2",
    },
  );

  await mainPage.open();

  await mainPage.expectLogMessages(
    "unrelated",
  );

  const filtersPage = await mainPage.openFiltersPage();

  await filtersPage.getFilterCard({ regex: filter.messageRegex }).deleteButton.click();
  await mainPage.homeLogo.click();

  await mainPage.expectLogMessages(
    "unrelated",
    "apres-trace",
    filter.messageRegex,
    "pre-trace",
  );
});
