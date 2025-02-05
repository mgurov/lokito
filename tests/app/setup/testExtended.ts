import { appStateTest } from './AppStateFixture';
import { mainPageTest } from './pages/MainPageFixture';
import { storageTest } from './StorageFixture';
import { mergeTests } from '@playwright/test';

export const test = mergeTests(
    storageTest,
    appStateTest,
    mainPageTest,
);

export { expect } from '@playwright/test';