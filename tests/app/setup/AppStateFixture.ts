import { nextId } from "../util/nextId";
import { StorageFixture, storageTest } from "./StorageFixture";

export class AppStateFixture {
    constructor(private storage: StorageFixture) {
        this.storage = storage;
    }

    async sourceNames() {
        const sourcesStored = await this.storage.getLocalItem('sources')
        return ((sourcesStored || []) as [{ name: string }]).map(s => s.name);        
    }

    async givenSources(...sourceSpecs: sourceSpec[]) {
        await this.storage.setLocalItem('sources', sourceSpecs.map(toSource));
    }
}

type sourceSpec = { id?: string; name?: string; query?: string; color?: string; active?: boolean };

function toSource(spec: sourceSpec) {
    return {
        id: spec.id ?? nextId({prefix : 'source_'}),
        name: spec.name ?? 'Test Source',
        query: spec.query ?? '{job="test"}',
        color: spec.color ?? '#ff0000',
        active: spec.active ?? true,
    };
}

export const appStateTest = storageTest.extend<{ appState: AppStateFixture }>({
    appState: [
        async ({ storage }, use) => {
            await use(new AppStateFixture(storage));
        },
        { auto: true },
    ],
});
