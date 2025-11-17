import { Route } from "@playwright/test";
import { expect, test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../../setup/AppStateFixture";
import { Deferred } from "../../util/promises";

test.beforeEach(({ consoleLogging }) => {
  consoleLogging.ignoreErrorMessagesContaining("Failed to load resource:");
});

test(
  "should show error upon failure to fetch",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage }) => {
    await mainPage.onLokiRequest(async (request) => {
      await request.abort();
    });

    const source = await appState.givenSource();

    await mainPage.open({ startFetch: true });

    await expect(mainPage.sourceTabHeader(source).getByTestId("source-name")).toHaveClass("animate-pulse");
    await expect(mainPage.sourceTabHeader(source).getByTestId("source-in-error-indicator")).toBeVisible();
  },
);

test("should keep fetching after a delayed response", async ({ mainPage, logs }) => {
  logs.givenRecords({ message: "e1" });

  await mainPage.open({ startFetch: true, installClock: true });

  await mainPage.expectLogMessages("e1");

  // next cycle
  logs.givenRecords({ message: "e2" });

  const delayedResponse = new Deferred<void>();
  await mainPage.onLokiRequest(async (request) => {
    await delayedResponse.promise;
    await request.abort();
  }, { times: 1 });

  await mainPage.waitNextSyncCycle({ timeToWait: "01:30" });

  await mainPage.expectLogMessages("e1");

  delayedResponse.resolve();

  await mainPage.waitNextSyncCycle({ timeToWait: "01:30" });

  await mainPage.expectLogMessages("e2", "e1");

  // next cycle
  logs.givenRecords({ message: "e3" });
  await mainPage.waitNextSyncCycle({ timeToWait: "01:30" });
  await mainPage.expectLogMessages("e3", "e2", "e1");
});

test("should show error of query exceeds the time limit", async ({ mainPage }) => {
  await mainPage.onLokiRequest(async (request) => {
    await request.fulfill(
      {
        status: 400,
        body: "the query time range exceeds the limit (query length: 8760h17m8.612s, limit: 30d1h)",
      },
    );
  });

  await mainPage.open();

  await expect(mainPage.page.getByText("the query time range exceeds")).toBeVisible();
});

test(
  "should show source failure indication on the main page for the initial fetches",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    const [source1, source2] = await appState.givenSources({ query: "q1" }, { query: "q2" });
    logs.givenSpecialQueryHandler(source2.query, failRequest);

    await mainPage.open({ installClock: true, startFetch: true });

    await expect(mainPage.page.getByText("Some sources failed to fetch logs")).toBeVisible();
    await expect(mainPage.cleanCheck).toBeVisible();

    await test.step("warning should also be visible when some messages fetched", async () => {
      logs.givenSourceRecords(source1, "s1.1");

      await mainPage.waitNextSyncCycle();

      await mainPage.expectLogMessages("s1.1");

      await expect(mainPage.page.getByText("Some sources failed to fetch logs")).toBeVisible();
    });

    await test.step("warning should be gone after fetch OK", async () => {
      logs.resetSpecialQueryHandler(source2.query);
      logs.givenSourceRecords(source2, "s2.1");

      await mainPage.waitNextSyncCycle();

      await mainPage.expectLogMessages("s2.1", "s1.1");

      await expect(mainPage.page.getByText("Some sources failed to fetch logs")).not.toBeVisible();
    });
  },
);

test(
  "should not show the fetching issues indication until the fetch actually happened",
  async ({ mainPage }) => {
    const requestPaused = new Deferred();
    const unpauseRequest = new Deferred();

    await mainPage.onLokiRequest(async (request) => {
      requestPaused.resolve();
      await unpauseRequest.promise;
      return request.abort();
    });

    // when

    await mainPage.open({ installClock: true, startFetch: true });
    await requestPaused.promise;

    await expect(mainPage.page.getByText("Some sources failed to fetch logs")).not.toBeVisible();

    unpauseRequest.resolve();

    await expect(mainPage.page.getByText("Some sources failed to fetch logs")).toBeVisible();
  },
);

test(
  "should show source failure indication on the main page for the repeating failures",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    const [source1, source2] = await appState.givenSources({ query: "q1" }, { query: "q2" });

    await test.step("first cycle, all clean", async () => {
      logs.givenSourceRecords(source1, "s1.1");

      await mainPage.open({ installClock: true, startFetch: true });

      await mainPage.expectLogMessages("s1.1");

      await expect(mainPage.page.getByText("Some sources failed to fetch logs")).not.toBeVisible();
    });

    // when we start to receive errors
    logs.givenSpecialQueryHandler(source2.query, failRequest);

    await test.step("first error is considered to be a hiccup", async () => {
      logs.givenSourceRecords(source1, "s1.2");

      await mainPage.waitNextSyncCycle();

      await mainPage.expectLogMessagesRev("s1.1", "s1.2");

      await expect(mainPage.page.getByText("Some sources failed to fetch logs")).not.toBeVisible();
    });

    await test.step("second error is considered to be systematic", async () => {
      logs.givenSourceRecords(source1, "s1.3");

      await mainPage.waitNextSyncCycle();

      await mainPage.expectLogMessagesRev("s1.1", "s1.2", "s1.3");

      await expect(mainPage.page.getByText("Some sources failed to fetch logs")).toBeVisible();
    });

    await test.step("warning should be gone after fetch OK", async () => {
      logs.resetSpecialQueryHandler(source2.query);
      logs.givenSourceRecords(source2, "s2.1");

      await mainPage.waitNextSyncCycle();

      await mainPage.expectLogMessagesRev("s1.1", "s1.2", "s1.3", "s2.1");

      await expect(mainPage.page.getByText("Some sources failed to fetch logs")).not.toBeVisible();
    });
  },
);

const failRequest = async (route: Route) => {
  await route.fulfill(
    {
      status: 400,
      body: "failed what so ever",
    },
  );
};
