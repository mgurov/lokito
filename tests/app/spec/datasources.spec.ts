import { expect, test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../setup/AppStateFixture";
import { Deferred } from "../util/promises";

test("should show error when no datasources", async ({ page, mainPage }) => {
  await page.route("/config/data-sources", async (route) =>
    route.fulfill({
      json: [],
    }));

  await mainPage.open({ startFetch: false });

  await expect(mainPage.getByTestId("loki-datasources-empty")).toContainText(
    /No Loki datasources have been configured\./,
  );
  await expect(mainPage.newSourceButton).not.toBeVisible();
});

test("should show error when error fetching datasources", async ({ page, mainPage, consoleLogging }) => {
  consoleLogging.ignoreErrorMessagesContaining("Failed to load resource: net::ERR_FAILED");

  await page.route("/config/data-sources", async (route) => route.abort());

  await mainPage.open({ startFetch: false });

  await expect(mainPage.getByTestId("loki-datasources-error")).toContainText(
    /Error fetching Loki datasources configuration\./,
  );

  await expect(mainPage.newSourceButton).not.toBeVisible();
});

test("should be fine by default", async ({ page, mainPage }) => {
  const dataSourcesBlocked = new Deferred();

  await page.route("/config/data-sources", async (route) => {
    await dataSourcesBlocked.promise;
    return route.fallback();
  });

  await mainPage.open({ startFetch: false });

  await test.step("loading", async () => {
    await expect(mainPage.getByTestId("loki-datasources-loading")).toContainText(
      /Loading Loki datasources configuration/,
    );
    await expect(mainPage.newSourceButton).not.toBeVisible();
  });

  dataSourcesBlocked.resolve();

  await expect(mainPage.newSourceButton).toBeVisible();

  await expect(mainPage.getByTestId("loki-datasources-loading")).not.toBeAttached();
});

test(
  "should route source queries to first datasource if not defined",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage, consoleLogging }) => {
    consoleLogging.ignoreErrorMessagesContaining("error fetching logs Error: No datasource configured for source");

    await appState.givenDatasourcesConfig(
      { id: "default" },
      { id: "second" },
    );

    const [source1] = await appState.givenSources(
      { datasource: null },
    );

    await mainPage.open({ startFetch: true });

    // TODO: check indication on the tab.
    await mainPage.selectSourceTab(source1);
    await expect(mainPage.page.getByText("No datasource configured for source")).toBeVisible();
  },
);

test(
  "should route source queries to preconfigured datasource even if not awailable anymore",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage, logs }) => {
    await appState.givenDatasourcesConfig(
      { id: "primary" },
    );

    await appState.givenSources(
      { query: "{job='secondus'}", datasource: "second" },
    );

    await mainPage.open({ startFetch: true });

    await expect.poll(() => {
      return logs.requests.map(u => u.pathname + "?" + u.searchParams.get("query"));
    }).toStrictEqual([
      "/loki-proxy/second/api/v1/query_range?{job='secondus'}",
    ]);
  },
);

test(
  "should route queries per configured datasource",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage, logs }) => {
    // TODO: doesn't matter actually. Test should call predefined even if missed; the first one if undefined though.
    await appState.givenDatasourcesConfig(
      { id: "default" },
      { id: "second" },
    );

    await appState.givenSources(
      { query: "{job='primus'}", datasource: "default" },
      { query: "{job='secondus'}", datasource: "second" },
    );

    await mainPage.open({ startFetch: true });

    await expect.poll(() => {
      return logs.requests.map(u => u.pathname + "?" + u.searchParams.get("query"));
    }).toStrictEqual([
      "/loki-proxy/default/api/v1/query_range?{job='primus'}",
      "/loki-proxy/second/api/v1/query_range?{job='secondus'}",
    ]);
  },
);
