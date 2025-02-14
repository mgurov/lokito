import { appStateTest } from './AppStateFixture';
import { consoleLoggingTest } from './ConsoleLoggingFixture';
import { mainPageTest } from './pages/MainPageFixture';
import { storageTest } from './StorageFixture';
import { mergeTests } from '@playwright/test';

export const test = mergeTests(
    storageTest,
    appStateTest,
    mainPageTest,
    consoleLoggingTest,
);

export { expect } from '@playwright/test';