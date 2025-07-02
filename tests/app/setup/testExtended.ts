import { mergeTests } from "@playwright/test";
import { appStateTest } from "./AppStateFixture";
import { consoleLoggingTest } from "./ConsoleLoggingFixture";
import { externalLogsTest } from "./ExternalLogsFixture";
import { filtersPageTest } from "./pages/FiltersPageFixture";
import { mainPageTest } from "./pages/MainPageFixture";
import { sourcePageTest } from "./pages/SourcesPageFixture";
import { storageTest } from "./StorageFixture";

export const test = mergeTests(
  storageTest,
  appStateTest,
  mainPageTest,
  consoleLoggingTest,
  sourcePageTest,
  externalLogsTest,
  filtersPageTest,
);

export { expect } from "@playwright/test";
