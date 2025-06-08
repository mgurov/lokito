import { test, Page } from '@playwright/test';

export class StorageFixture {
    constructor(private page: Page) {
        this.page = page;
    }

    // NB: there's no guarantee on the order of the items set in localStorage
    // TODO: opts at the end..
    async setLocalItem(key: string, value: unknown, rawString: boolean = false) {
        const valueString = rawString ? (value as string) : JSON.stringify(value);
        await this.page.addInitScript(
            ([key, valueString]) => {
                window.localStorage.setItem(key, valueString);
            },
            [key, valueString]
        );
    }

    async setSessionItem(key: string, value: unknown, rawString: boolean = false) {
        const valueString = rawString ? (value as string) : JSON.stringify(value);
        await this.page.addInitScript(
            ([key, valueString]) => {
                window.sessionStorage.setItem(key, valueString);
            },
            [key, valueString]
        );
    }

    async getLocalItem<T>(key: string, rawString: boolean = false): Promise<T | null> {
        const storedString = await this.page.evaluate(key => {
            return localStorage.getItem(key);
        }, key);

        if (storedString === null) {
            return null;
        }
        if (rawString) {
            return storedString as T; //TODO: guess if T is string? 
        } else {
            return JSON.parse(storedString) as T;
        }
        
    }
}

export const storageTest = test.extend<{ storage: StorageFixture }>({
    storage: [
        async ({ page }, use) => {
            await use(new StorageFixture(page));
        },
        { auto: true },
    ],
});
