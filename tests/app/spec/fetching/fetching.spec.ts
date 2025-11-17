import { expect, test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../../setup/AppStateFixture";
import { Deferred } from "../../util/promises";
import { expectTexts } from "../../util/visualAssertions";

test("fetching messages", async ({ mainPage, logs }) => {
  logs.givenRecords({ message: "event1" });

  await mainPage.open({ startFetch: true, installClock: true });

  await mainPage.expectLogMessages("event1");

  logs.givenRecords({ message: "event2" }, { message: "event3" });

  await mainPage.waitNextSyncCycle();

  await mainPage.expectLogMessages("event3", "event2", "event1");
});

test("should support force fetch new messages", async ({ page, mainPage, logs }) => {
  logs.givenRecords({ message: "event1" });

  await mainPage.open({ startFetch: true, installClock: true });

  await mainPage.expectLogMessages("event1");

  logs.givenRecords({ message: "event2" });

  await mainPage.forceFetchButton.click();

  await page.clock.runFor("00:01");

  await mainPage.expectLogMessagesRev("event1", "event2");
});

test("force cycle button should not be visible before start and disabled while cycling", async ({ mainPage }) => {
  await mainPage.open({ startFetch: false, installClock: true });

  await expect(mainPage.forceFetchButton).not.toBeAttached();

  await mainPage.startFetchingButton().click();

  await expect(mainPage.forceFetchButton).toBeEnabled();

  const holdLokiResponse = new Deferred();
  await mainPage.onLokiRequest(async (request) => {
    await holdLokiResponse.promise;
    await request.fallback();
  });

  await mainPage.waitNextSyncCycle();
  await expect(mainPage.forceFetchButton).toBeDisabled();
  holdLokiResponse.resolve();
  await expect(mainPage.forceFetchButton).toBeEnabled();
});

test("new messages should be marked such", async ({ mainPage, logs }) => {
  logs.givenRecords("event1");

  await mainPage.open({ startFetch: true, installClock: true });

  await expect(mainPage.logRowByMessage("event1").getByTestId("log-table-row-header")).toHaveClass(/new-entry/);

  logs.givenRecords("event2");

  await mainPage.waitNextSyncCycle();

  await expect(mainPage.logRowByMessage("event2").getByTestId("log-table-row-header")).toHaveClass(/new-entry/);
  await expect(mainPage.logRowByMessage("event1").getByTestId("log-table-row-header")).not.toHaveClass(/new-entry/);
});

test("should sort fetched messages", AnnotationSuppressDefaultApp, async ({ appState, mainPage, logs }) => {
  const [s1, s2] = await appState.givenSources({ name: "existing" });

  logs.givenSourceRecords(s1, { message: "earlier", timestamp: "1" }, { message: "later", timestamp: "3" });
  logs.givenSourceRecords(s2, { message: "middle", timestamp: "2" }, { message: "the latest", timestamp: "4" });

  await mainPage.open({ startFetch: true });

  await mainPage.expectLogMessages("the latest", "later", "middle", "earlier");
});

test(
  "should fetch updated query on editing",
  AnnotationSuppressDefaultApp,
  async ({ page, appState, mainPage, logs }) => {
    const [existing] = await appState.givenSources({ name: "existing", query: "{job='test'}" });

    await mainPage.open({ startFetch: true, installClock: true });

    await expect.poll(() => {
      return logs.requests.map(u => u.searchParams.get("query"));
    }).toStrictEqual(["{job='test'}"]);

    const sourceCard = (await mainPage.clickToSources()).sourceCard(existing.id);

    await sourceCard.changeQuery("{job=\"updated query\"}");

    await page.clock.runFor("01:30");

    await expect.poll(() => {
      return logs.requests.map(u => u.searchParams.get("query"));
    }).toStrictEqual([
      "{job='test'}", // from before
      "{job=\"updated query\"}",
    ]);
  },
);

test("duplications should be filtered out on fetching", async ({ mainPage, logs }) => {
  const sameTimestamp = "2025-02-04T20:00:00.000Z";
  const sameData = { "event": "event1" };
  const anotherTimestamp = "2025-02-04T20:00:00.001Z";

  logs.givenRecords({ message: "event1", timestamp: sameTimestamp, data: sameData });

  await mainPage.open({ startFetch: true, installClock: true });

  await mainPage.expectLogMessages("event1");

  // NB: the deduplication doesn't care about the message, only the timestamp and the data
  logs.givenRecords(
    { message: "event2", timestamp: anotherTimestamp, data: sameData }, // to be added because of the different timestamp
    { message: "event3", timestamp: sameTimestamp, data: { "event": "event3" } }, // to be added because the data differs
    { message: "event4", timestamp: sameTimestamp, data: sameData }, // to be skipped
  );

  await mainPage.waitNextSyncCycle();

  await mainPage.expectLogMessages("event2", "event3", "event1");
});

test(
  "same message should be shown both sources that happened to fetch it",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    const [s1, s2] = await appState.givenSources({ name: "s1" }, { name: "s2" });

    const sameTimestamp = "2025-02-04T20:00:00.000Z";
    const sameData = { "event": "event1" };

    logs.givenSourceRecords(s1, { message: "s1 event1", timestamp: sameTimestamp, data: sameData });
    // NB: message can be formatted differently different sources
    logs.givenSourceRecords(s2, { message: "s2 event1", timestamp: sameTimestamp, data: sameData });

    await mainPage.open({ startFetch: true });

    await mainPage.expectLogMessages("s1 event1"); // ok, we take the first message

    const firstSourceMaker = mainPage.page.getByTestId("log-table-row")
      .getByTestId("log-row-source-marker");
    await expectTexts(firstSourceMaker, "s1", "s2");

    await mainPage.selectSourceTab(s1);
    await mainPage.expectLogMessages("s1 event1");
    await mainPage.selectSourceTab(s2);
    await mainPage.expectLogMessages("s2 event1");
  },
);

test(
  "should mark fetched messages with their source names in the all tab but not in the source one",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage, logs }) => {
    const [s1, s2] = await appState.givenSources({ name: "s1" }, { name: "s2" });

    logs.givenSourceRecords(s1, "m1");
    logs.givenSourceRecords(s2, "m2");

    await mainPage.open({ startFetch: true });

    await mainPage.expectLogMessages("m2", "m1");

    const firstSourceMaker = mainPage.page.getByTestId("log-table-row")
      .filter({ hasText: /m1/ })
      .getByTestId("log-row-source-marker");
    await expect(firstSourceMaker).toHaveText("s1");

    await expect(
      mainPage.page.getByTestId("log-table-row")
        .filter({ hasText: /m2/ })
        .getByTestId("log-row-source-marker"),
    ).toHaveText("s2");

    // and then when switched to the source - no need to show it

    await mainPage.selectSourceTab(s1);

    await expect(firstSourceMaker).not.toBeAttached();
  },
);

test(
  "should open source tab when clicking on row source indicator",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage, logs }) => {
    const [s1, s2] = await appState.givenSources({ name: "s1" }, { name: "s2" });

    logs.givenSourceRecords(s1, "m1");
    logs.givenSourceRecords(s2, "m2");

    await mainPage.open({ startFetch: true });

    await mainPage.expectLogMessages("m2", "m1");

    const firstSourceMaker = mainPage.page.getByTestId("log-table-row")
      .filter({ hasText: /m1/ })
      .getByTestId("log-row-source-marker");
    await expect(firstSourceMaker).toHaveText("s1");

    await firstSourceMaker.click();

    // then we're on the s1 source page

    await expect(firstSourceMaker).not.toBeAttached();

    await mainPage.expectLogMessages("m1");
  },
);

test("should show more messages when requested", async ({ mainPage, logs }) => {
  const logLines = Array.from({ length: 50 }, (_, i) => `message ${i}`);

  logs.givenRecords(...[...logLines].reverse()); // log lines appear reverse their registration in the logs fixture

  await mainPage.open();

  await mainPage.expectLogMessages(...logLines.slice(0, 20));
  await expect.poll(async () => mainPage.page.title()).toBe("Lokito🔥50");

  await expect(mainPage.showMoreButton).toHaveText("20 more");
  await expect(mainPage.showAllButton).toBeVisible();
  await mainPage.showMoreButton.click();

  await mainPage.expectLogMessages(...logLines.slice(0, 40));

  await expect(mainPage.showMoreButton).not.toBeVisible();
  await mainPage.showAllButton.click();

  await mainPage.expectLogMessages(...logLines);
  await expect(mainPage.showMoreButton).not.toBeVisible();
  await expect(mainPage.showAllButton).not.toBeVisible();
});

test("should show all remaining messages when requested", async ({ mainPage, logs }) => {
  const logLines = Array.from({ length: 50 }, (_, i) => `message ${i}`);

  logs.givenRecords(...[...logLines].reverse()); // log lines appear reverse their registration in the logs fixture

  await mainPage.open();

  await mainPage.expectLogMessages(...logLines.slice(0, 20));

  await mainPage.showAllButton.click();

  await mainPage.expectLogMessages(...logLines);
  await expect(mainPage.showMoreButton).not.toBeVisible();
  await expect(mainPage.showAllButton).not.toBeVisible();
});
