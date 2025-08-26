import { TRACE_ID_FIELDS } from "@/hardcodes";
import { expect, test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../setup/AppStateFixture";

test(
  "should mark multiple messages sharing the same traceId across sources",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage, logs }) => {
    const [source1, source2] = await appState.givenSources(
      { name: "source1" },
      { name: "source2" },
    );

    logs.givenSourceRecords(source1, { message: "source1.1", traceId: "tr-1", timestamp: "1" }, {
      message: "source1.2",
      traceId: "tr-2",
      timestamp: "2",
    });
    logs.givenSourceRecords(source2, { message: "source2.1", timestamp: "3" }, {
      message: "source2.2",
      traceId: "tr-1",
      timestamp: "4",
    });

    await mainPage.open();

    await mainPage.expectLogMessages("source2.2", "source2.1", "source1.2", "source1.1");

    // should mark the repeating traces
    await expect(mainPage.traceButton("tr-1")).toHaveCount(2);
    await expect(mainPage.traceButton("tr-2")).toHaveCount(0);

    // and then we check the related logs in a view
    await mainPage.openTrace("tr-1");

    await mainPage.expectLogMessages("source2.2", "source1.1");
    await expect(mainPage.traceButton("tr-1")).toHaveCount(0);
  },
);

test("acked and non-acked messages should be visible by trace id", async ({ appState, mainPage, logs }) => {
  await appState.givenFilters({
    messageRegex: "autoack",
    captureWholeTrace: false,
  });

  logs.givenRecords(
    { message: "non-acked", traceId: "tr-1", timestamp: "1" },
    { message: "autoack", traceId: "tr-1", timestamp: "2" },
  );

  await mainPage.open();

  await mainPage.expectLogMessages("non-acked");
  await mainPage.expectAckMessages(1);

  await mainPage.openTrace("tr-1");

  await mainPage.expectLogMessages("autoack", "non-acked");

  await expect(mainPage.getByTestId("ack-message-button")).toHaveCount(1);

  await mainPage.getByTestId("ack-message-button").click();

  await expect(mainPage.getByTestId("ack-message-button")).toHaveCount(0);
});

test("should be able to ack all on the trace view", async ({ mainPage, logs }) => {
  logs.givenRecords(
    { message: "m1", traceId: "tr-1" },
    { message: "m2", traceId: "tr-1" },
  );

  await mainPage.open();

  await mainPage.openTrace("tr-1");

  await expect(mainPage.getByTestId("ack-message-button")).toHaveCount(2);

  await mainPage.clickAckAll({ expectedCount: 2 });

  await expect(mainPage.getByTestId("ack-message-button")).toHaveCount(0);
  await expect(mainPage.getByTestId("unack-message-button")).toHaveCount(2);
});

test("different traces same message", async ({ mainPage, logs }) => {
  await mainPage.clock.install();

  logs.givenRecords(
    { message: "message1", data: { [TRACE_ID_FIELDS[0]]: "tr-0", [TRACE_ID_FIELDS[1]]: "tr-1" } },
  );

  await mainPage.open();

  await mainPage.expectLogMessages("message1");

  await expect(mainPage.traceButton("tr-0")).toHaveCount(0);
  await expect(mainPage.traceButton("tr-1")).toHaveCount(0);

  logs.givenRecords({ message: "message2", data: { [TRACE_ID_FIELDS[1]]: "tr-0" } });

  await mainPage.clock.runFor("01:01");

  await mainPage.expectLogMessages("message2", "message1");

  await expect(mainPage.traceButton("tr-0")).toHaveCount(2);
  await expect(mainPage.traceButton("tr-1")).toHaveCount(0);

  await mainPage.openTrace("tr-0");
  await mainPage.expectLogMessages("message2", "message1");
});

test("same trace same message twice", async ({ mainPage, logs }) => {
  await mainPage.clock.install();

  logs.givenRecords(
    { message: "message1", data: { [TRACE_ID_FIELDS[0]]: "tr-0", [TRACE_ID_FIELDS[1]]: "tr-0" } },
  );

  await mainPage.open();

  await mainPage.expectLogMessages("message1");

  await expect(mainPage.traceButton("tr-0")).toHaveCount(0);
  await expect(mainPage.traceButton("tr-1")).toHaveCount(0);

  logs.givenRecords({ message: "message2", data: { [TRACE_ID_FIELDS[1]]: "tr-0" } });

  await mainPage.clock.runFor("01:01");

  await mainPage.expectLogMessages("message2", "message1");

  await expect(mainPage.traceButton("tr-0")).toHaveCount(2);
  await expect(mainPage.traceButton("tr-1")).toHaveCount(0);

  await mainPage.openTrace("tr-0");
  await mainPage.expectLogMessages("message2", "message1");
});

test("make sure the auto-acked messages don't disappear completely when apres-trace-id ingested", async ({ appState, mainPage, logs }) => {
  await appState.givenFilters({
    messageRegex: "autoack",
    captureWholeTrace: false,
  });
  await mainPage.clock.install();

  logs.givenRecords(
    { message: "autoack", data: { [TRACE_ID_FIELDS[0]]: "tr-0", [TRACE_ID_FIELDS[1]]: "tr-0" } },
  );

  await mainPage.open();

  await mainPage.expectLogMessages();
  await mainPage.expectAckMessages(1);

  logs.givenRecords({ message: "message2", data: { [TRACE_ID_FIELDS[1]]: "tr-0" } });

  await mainPage.clock.runFor("01:01");

  await mainPage.expectLogMessages("message2");
  await expect(mainPage.traceButton("tr-0")).toHaveCount(1);

  await mainPage.openTrace("tr-0");
  await mainPage.expectLogMessages("message2", "autoack");
});

test("should keep the dropdown open when refetching the messages", async ({ mainPage, logs }) => {
  await mainPage.clock.install();

  logs.givenRecords(
    { message: "message1", traceId: "tr-1" },
    { message: "message2", traceId: "tr-1" },
  );

  await mainPage.open();

  await mainPage.traceButton("tr-1").first().click();
  await expect(mainPage.getByTestId("trace-show")).toBeVisible();

  await mainPage.waitNextSyncCycle();

  await expect(mainPage.getByTestId("trace-show")).toBeVisible();
});

test("trace path shouldnt fail on nothing found", async ({ page }) => {
  await page.goto("/by-trace/not-yet-registered-anything");
  await expect(page.getByTestId("trace-id-header")).toContainText("not-yet-registered-anything");
});

test("should be able to create a filter from the trace page", async ({ mainPage, logs }) => {
  logs.givenRecords(
    { message: "message1", traceId: "tr-1" },
    { message: "message2", traceId: "tr-1" },
  );

  await mainPage.open();

  await mainPage.openTrace("tr-1");

  await expect(mainPage.getByTestId("ack-message-button")).toHaveCount(2);

  await mainPage.createFilter({
    logLineText: "message1",
  });

  await expect(mainPage.getByTestId("ack-message-button")).toHaveCount(0);
});
