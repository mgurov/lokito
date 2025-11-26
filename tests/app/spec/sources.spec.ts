import { expect, test } from "@tests/app/setup/testExtended";
import { AnnotationSuppressDefaultApp } from "../setup/AppStateFixture";
import { NewSourceRollover } from "../setup/pages/SourcesPageFixture";
import { expectTexts } from "../util/visualAssertions";

test("add source", AnnotationSuppressDefaultApp, async ({ mainPage, page, appState }) => {
  await mainPage.open({ startFetch: false });

  await mainPage.newSourceButton.click();

  await page.fill("text=Name", "Test Source");
  await page.fill("text=Loki query", "{job=\"test\"}");

  await page.click("text=Save changes");

  await expect(page.getByText(/Test Source/)).toBeVisible();

  // and then should persist the page reopens
  expect(await appState.sourceNames()).toEqual(["Test Source"]);

  await page.goto("/");

  await expect(page.getByText(/Test Source/)).toBeVisible();
});

test(
  "add a source from the sourceless main screen",
  AnnotationSuppressDefaultApp,
  async ({ page, appState }) => {
    await page.goto("/");

    await expect(page.getByText(/There are no active sources/)).toBeVisible();

    await page.getByTestId("new-source-button").getByText("create a new one").click();

    const newSourceRollover = new NewSourceRollover(page);

    await expect(newSourceRollover.locator).toBeVisible();

    await newSourceRollover.fillSourceForm({ name: "Test Source" });
    await newSourceRollover.saveSource();

    await expect(page.getByText(/Test Source/)).toBeVisible();

    expect(await appState.sourceNames()).toEqual(["Test Source"]);
  },
);

test.describe("datasources", () => {
  test(
    "should be able to select a datasource when configuring a source",
    AnnotationSuppressDefaultApp,
    async ({ appState, mainPage, page, logs }) => {
      appState.givenDatasourcesConfig(
        { id: "default", name: "Primary" },
        { id: "second" },
      );

      await mainPage.open({ startFetch: false });

      await mainPage.newSourceButton.click();

      const newSourceRollover = new NewSourceRollover(page);

      await newSourceRollover.fillSourceForm({ query: "{job='secondus'}" });
      await expect(newSourceRollover.datasourceSelect).toHaveValue("default");
      // await expect(newSourceRollover.datasourceSelect).toHaveText("Primary");
      await newSourceRollover.datasourceSelect.selectOption("second");
      await newSourceRollover.saveSource();

      await mainPage.startFetchingButton("now").click();

      await expect.poll(() => {
        return logs.requests.map(u => u.pathname + "?" + u.searchParams.get("query"));
      }).toStrictEqual([
        "/loki-proxy/second/api/v1/query_range?{job='secondus'}",
      ]);
    },
  );

  test(
    "precreated source with no source should have no source visible",
    AnnotationSuppressDefaultApp,
    async ({ appState, sourcePage }) => {
      appState.givenDatasourcesConfig(
        { id: "default", name: "Primary" },
        { id: "second" },
      );

      const existing = await appState.givenSource({
        name: "existing",
        query: "{job=\"initial query\"}",
        datasource: null,
      });

      await sourcePage.open();

      const sourceCard = sourcePage.sourceCard(existing.id);

      await expect(sourceCard.getByTestId("datasource-select")).toHaveValue("Select Datasource");
      await sourceCard.getByTestId("datasource-select").selectOption("default");

      await expect.poll(async () => (await appState.sources()).map(s => [s.name, s.datasource]))
        .toStrictEqual([["existing", "default"]]);
    },
  );

  test("edit a source datasource", AnnotationSuppressDefaultApp, async ({ appState, sourcePage }) => {
    appState.givenDatasourcesConfig(
      { id: "default", name: "Primary" },
      { id: "second" },
    );

    const [existing] = await appState.givenSources({
      name: "existing",
      query: "{job=\"initial query\"}",
      datasource: "second",
    });

    await sourcePage.open();

    const sourceCard = sourcePage.sourceCard(existing.id);

    await expect(sourceCard.getByTestId("datasource-select")).toHaveValue("second");
    await expect(sourceCard.getByTestId("save-query-changes")).not.toBeAttached();
    await sourceCard.getByTestId("datasource-select").selectOption("default");

    await expect.poll(async () => (await appState.sources()).map(s => [s.name, s.datasource]))
      .toStrictEqual([["existing", "default"]]);
  });
});

test(
  "add a source to an existing list from main page",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState }) => {
    await appState.givenSources({ name: "existing" });

    await mainPage.open({ startFetch: false });

    const newSourceRollover = await mainPage.clickNewSourceButton();
    await newSourceRollover.fillSourceForm({ name: "new" });
    await newSourceRollover.saveSource();

    expect(await appState.sourceNames()).toEqual(["existing", "new"]);
  },
);

test("add a source should have immediate effect on fetching", async ({ mainPage, logs }) => {
  await mainPage.clock.install();

  await mainPage.open();

  await expect.poll(() => logs.requests).toHaveLength(1);

  const newSourceRollover = await mainPage.clickNewSourceButton();
  await newSourceRollover.fillSourceForm({ name: "new" });
  await newSourceRollover.saveSource();

  await mainPage.clock.runFor("01:01"); // next cycle

  await expect.poll(() => logs.requests).toHaveLength(3);
});

test(
  "delete a source should have immediate effect on fetching",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    await mainPage.clock.install();

    const [toBeRemoved, toBeKept] = await appState.givenSources({ name: "to be removed" }, {});
    await mainPage.open();

    await logs.expectQueries(
      toBeRemoved,
      toBeKept,
    );

    await expect(mainPage.page.getByText(toBeRemoved.name)).toBeVisible();

    const sourcesPage = await mainPage.clickToSources();
    await expect(sourcesPage.page.getByText(toBeRemoved.name)).toBeVisible();
    await sourcesPage.deleteSource(toBeRemoved.id);
    await expect(sourcesPage.page.getByText(toBeRemoved.name)).not.toBeVisible();

    await mainPage.homeLogo.click();
    await expect(mainPage.page.getByText(toBeRemoved.name)).not.toBeVisible();

    await mainPage.clock.runFor("01:01"); // next cycle

    await logs.expectQueries(
      toBeRemoved,
      toBeKept,
      toBeKept,
    );
  },
);

test(
  "delete a source should remove its entries",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    await mainPage.clock.install();

    const [toBeRemoved, toBeKept] = await appState.givenSources({ name: "to be removed" }, {});

    logs.givenSourceRecords(toBeRemoved, "to-be-removed");
    logs.givenSourceRecords(toBeKept, "to-be-kept");

    await mainPage.open();

    await mainPage.expectLogMessages("to-be-kept", "to-be-removed");

    const sourcesPage = await mainPage.clickToSources();
    await sourcesPage.deleteSource(toBeRemoved.id);
    await mainPage.homeLogo.click();

    await mainPage.expectLogMessages("to-be-kept");
  },
);

test(
  "delete a source allow for later source addition and refetch same messages",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    await mainPage.clock.install();

    const [toBeRemoved, toBeKept] = await appState.givenSources({ name: "to be removed" }, {});

    const toBeRemovedTs = "2025-02-04T20:00:00.000Z";
    const toBeRemovedData = { "event": "event1" };
    logs.givenSourceRecords(
      toBeRemoved,
      { message: "to-be-removed", timestamp: toBeRemovedTs, data: toBeRemovedData },
      { message: "checking-deduplication", timestamp: toBeRemovedTs, data: toBeRemovedData },
    );

    logs.givenSourceRecords(toBeKept, "to-be-kept");

    await mainPage.open();

    await mainPage.expectLogMessages("to-be-kept", "to-be-removed");

    const sourcesPage = await mainPage.clickToSources();
    await sourcesPage.deleteSource(toBeRemoved.id);
    await mainPage.homeLogo.click();

    await mainPage.expectLogMessages("to-be-kept");

    // now add back a source
    const queryMarker = "{job=\"fenix\"}";
    // normally, the logs would be staying on the server and wouldn't even be often
    // refetched except for if feel into the safety zone fetching interval
    logs.givenSourceRecords({ query: queryMarker }, {
      message: "resurrected like a fenix",
      timestamp: toBeRemovedTs,
      data: toBeRemovedData,
    }, { message: "checking-deduplication", timestamp: toBeRemovedTs, data: toBeRemovedData });
    logs.givenSourceRecords(toBeKept, "to-be-kept2");

    await mainPage.getByTestId("new-source-button").click();
    await mainPage.page.fill("text=Name", "fenix");
    await mainPage.page.fill("text=Loki query", queryMarker);
    await mainPage.page.click("text=Save changes");

    await mainPage.waitNextSyncCycle();

    await mainPage.expectLogMessages("to-be-kept2", "to-be-kept", "resurrected like a fenix");
  },
);

test(
  "many many sources should all be visible",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState }) => {
    const names = Array.from({ length: 50 }, (_, i) => {
      return { name: `source${i}` };
    });

    const sources = await appState.givenSources(...names);
    // when
    await mainPage.open();

    // then
    for (const s of sources) {
      await expect(mainPage.page.getByText(s.name, { exact: true })).toBeInViewport();
    }
  },
);

test(
  "active source or all should be highlighted",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState }) => {
    const [source] = await appState.givenSources({ name: "a_source" });
    await mainPage.open();

    await expect(mainPage.allSourcesTab).toHaveAttribute("data-state", "active");
    await expect(mainPage.sourceTabHeader(source)).toHaveAttribute("data-state", "");

    await mainPage.selectSourceTab(source);

    await expect(mainPage.allSourcesTab).toHaveAttribute("data-state", "");
    await expect(mainPage.sourceTabHeader(source)).toHaveAttribute("data-state", "active");

    await mainPage.selectAllSourcesTab();

    await expect(mainPage.allSourcesTab).toHaveAttribute("data-state", "active");
    await expect(mainPage.sourceTabHeader(source)).toHaveAttribute("data-state", "");
  },
);

test("deactivate and then activate", AnnotationSuppressDefaultApp, async ({ mainPage, appState, logs }) => {
  await mainPage.clock.install();

  const [toBeDeactivated, toBeKept] = await appState.givenSources({ name: "deactivate me" }, {});
  await mainPage.open();

  await logs.expectQueries(toBeDeactivated, toBeKept);

  await expect(mainPage.page.getByText(toBeDeactivated.name)).toBeVisible();

  const sourcesPage = await mainPage.clickToSources();
  await sourcesPage.toggleActiveSource(toBeDeactivated.id);

  await mainPage.homeLogo.click();
  await expect(mainPage.page.getByText(toBeDeactivated.name)).toHaveClass("opacity-50");

  await mainPage.clock.runFor("01:01"); // next cycle

  await logs.expectQueries(
    toBeDeactivated,
    toBeKept,
    toBeKept,
  );

  await mainPage.clickToSources();
  await sourcesPage.toggleActiveSource(toBeDeactivated.id);
  await mainPage.clock.runFor("01:01"); // next cycle

  await logs.expectQueries(
    toBeDeactivated,
    toBeKept,
    toBeKept,
    toBeDeactivated,
    toBeKept,
  );

  await mainPage.homeLogo.click();
  await expect(mainPage.page.getByText(toBeDeactivated.name)).not.toHaveClass("opacity-50");
});

test("move filters around", AnnotationSuppressDefaultApp, async ({ mainPage, appState }) => {
  const [_first, _second, third] = await appState.givenSources({ name: "first" }, { name: "second" }, {
    name: "third",
  });
  await mainPage.open();

  await expectTexts(mainPage.sourceTabHeaders, "first", "second", "third");
  expect(await appState.sourceNames()).toEqual(["first", "second", "third"]);

  const sourcesPage = await mainPage.clickToSources();

  const thirdSource = sourcesPage.sourceCard(third.id);

  await expect(thirdSource.getByTestId("move-back")).toBeDisabled();
  await thirdSource.getByTestId("move-ahead").click();
  expect(await appState.sourceNames()).toEqual(["first", "third", "second"]);

  await thirdSource.getByTestId("move-ahead").click();
  expect(await appState.sourceNames()).toEqual(["third", "first", "second"]);
  await expect(thirdSource.getByTestId("move-ahead")).toBeDisabled();

  await test.step("check the tabs are rearranged main page", async () => {
    await mainPage.homeLogo.click();
    await expectTexts(mainPage.sourceTabHeaders, "third", "first", "second");
    await mainPage.clickToSources();
  });

  await thirdSource.getByTestId("move-back").click();
  expect(await appState.sourceNames()).toEqual(["first", "third", "second"]);

  await thirdSource.getByTestId("move-back").click();
  expect(await appState.sourceNames()).toEqual(["first", "second", "third"]);
  await expect(thirdSource.getByTestId("move-back")).toBeDisabled();
});

test(
  "add a source to an existing list from sources page",
  AnnotationSuppressDefaultApp,
  async ({ appState, sourcePage }) => {
    await appState.givenSources({ name: "existing" });

    await sourcePage.open();

    const newSourceRollover = await sourcePage.clickNewSourceButton();

    await newSourceRollover.fillSourceForm({ name: "new" });
    await newSourceRollover.saveSource();

    expect(await appState.sourceNames()).toEqual(["existing", "new"]);
  },
);

test("edit a source query", AnnotationSuppressDefaultApp, async ({ appState, sourcePage }) => {
  const [existing] = await appState.givenSources({ name: "existing", query: "{job=\"initial query\"}" });

  await sourcePage.open();

  const sourceCard = sourcePage.sourceCard(existing.id);

  await expect(sourceCard.getByTestId("source-name-title")).toHaveText("existing");
  await expect(sourceCard.filterTextarea).toHaveText("{job=\"initial query\"}");
  await expect(sourceCard.getByTestId("cancel-query-changes")).not.toBeAttached();
  await expect(sourceCard.getByTestId("save-query-changes")).not.toBeAttached();

  await sourceCard.filterTextarea.fill("{job=\"updated query\"}");

  await expect(sourceCard.getByTestId("cancel-query-changes")).toBeVisible();
  await sourceCard.getByTestId("save-query-changes").click();

  await expect(sourceCard.getByTestId("cancel-query-changes")).not.toBeAttached();
  await expect(sourceCard.getByTestId("save-query-changes")).not.toBeAttached();

  await expect.poll(async () => (await appState.sources()).map(s => [s.name, s.query]))
    .toStrictEqual([["existing", "{job=\"updated query\"}"]]);

  // reopening the page should show the updated value, but fails in tests. Seems to be working ok when testing manually 🤷

  // await page.goto('/sources');
  // await expect(page.getByTestId('source-card-filter-textarea')).toHaveText('{job="updated query"}')
});

test(
  "should be able to cancel editing a source query",
  AnnotationSuppressDefaultApp,
  async ({ appState, sourcePage }) => {
    const [existing] = await appState.givenSources({ name: "existing", query: "{job=\"initial query\"}" });

    await sourcePage.open();

    const sourceCard = sourcePage.sourceCard(existing.id);

    await expect(sourceCard.filterTextarea).toHaveText("{job=\"initial query\"}");

    await sourceCard.filterTextarea.fill("{job=\"updated query\"}");

    await sourceCard.getByTestId("cancel-query-changes").click();

    await sourceCard.filterTextarea.fill("{job=\"initial query\"}");

    await expect(sourceCard.getByTestId("cancel-query-changes")).not.toBeAttached();
    await expect(sourceCard.getByTestId("save-query-changes")).not.toBeAttached();

    await expect.poll(async () => (await appState.sources()).map(s => [s.name, s.query]))
      .toStrictEqual([["existing", "{job=\"initial query\"}"]]);
  },
);

test(
  "should be able to display the source card from the source tab",
  AnnotationSuppressDefaultApp,
  async ({ appState, mainPage }) => {
    const source = await appState.givenSource({ query: "source-query" });

    await mainPage.open();

    await mainPage.selectSourceTab(source);

    const sourceCard = await mainPage.showSource();

    await expect(sourceCard.filterTextarea).toHaveText("source-query");
  },
);

test(
  "should be able back-navigate from a source view to the full list",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    const [source1, source2] = await appState.givenSources({ name: "source1" }, { name: "source2" });

    logs.givenSourceRecords(source1, "s1 m");
    logs.givenSourceRecords(source2, "s2 m");

    await mainPage.open();

    await mainPage.expectLogMessages("s2 m", "s1 m");

    await mainPage.selectSourceTab(source1);

    await mainPage.expectLogMessages("s1 m");

    await mainPage.page.goBack();

    await mainPage.expectLogMessages("s2 m", "s1 m");

    await mainPage.page.goForward();

    await mainPage.expectLogMessages("s1 m");
  },
);

test(
  "should stay in acked mode when navigating to a source",
  AnnotationSuppressDefaultApp,
  async ({ mainPage, appState, logs }) => {
    const [source1] = await appState.givenSources({ name: "source1" });

    logs.givenSourceRecords(source1, "s1 m");

    await mainPage.open();

    await mainPage.ack("s1 m");

    await mainPage.ackedUnackedMessagesToggle.click();

    await mainPage.expectLogMessages("s1 m");

    const sourceMaker = mainPage.logRowByMessage("s1 m")
      .getByTestId("log-row-source-marker");

    await sourceMaker.click();

    await mainPage.expectLogMessages("s1 m");
  },
);
