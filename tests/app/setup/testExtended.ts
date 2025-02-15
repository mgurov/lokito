import { appStateTest } from './AppStateFixture';
import { consoleLoggingTest } from './ConsoleLoggingFixture';
import { externalLogsTest } from './ExternalLogsFixture';
import { mainPageTest } from './pages/MainPageFixture';
import { sourcePageTest } from './pages/SourcesPageFixture';
import { storageTest } from './StorageFixture';
import { mergeTests } from '@playwright/test';

export const test = mergeTests(
    storageTest,
    appStateTest,
    mainPageTest,
    consoleLoggingTest,
    sourcePageTest,
    externalLogsTest,
);

export { expect } from '@playwright/test';