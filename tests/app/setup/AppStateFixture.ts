import { StorageFixture, storageTest } from "./StorageFixture";

export class AppStateFixture {
    constructor(private storage: StorageFixture) {
        this.storage = storage;
    }

    async sourceNames() {
        const sourcesStored = await this.storage.getLocalItem('sources')
        return ((sourcesStored || []) as [{ name: string }]).map(s => s.name);        
    }
}

export const appStateTest = storageTest.extend<{ appState: AppStateFixture }>({
    appState: [
        async ({ storage }, use) => {
            await use(new AppStateFixture(storage));
        },
        { auto: true },
    ],
});
