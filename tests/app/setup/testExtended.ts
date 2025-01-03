import { appStateTest } from './AppStateFixture';
import { storageTest } from './StorageFixture';
import { mergeTests } from '@playwright/test';

export const test = mergeTests(
    storageTest,
    appStateTest,
);

export { expect } from '@playwright/test';