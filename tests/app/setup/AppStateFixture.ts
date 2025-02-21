import { Source } from "@/data/source";
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

    async sources() {
        const sourcesStored = await this.storage.getLocalItem('sources')
        return ((sourcesStored || []) as [Source]);
    }


    //NB: discards other sources
    async givenSource(sourceSpecs: sourceSpec = {}) {
        const [source] = await this.givenSources(...[sourceSpecs]);
        return source
    }

    async givenSources(...sourceSpecs: sourceSpec[]) {
        const sources = sourceSpecs.map(toSource);
        await this.storage.setLocalItem('sources', sources);
        return sources;
    }
}

type sourceSpec = { id?: string; name?: string; query?: string; color?: string; active?: boolean };

function toSource(spec: sourceSpec) {
    const seed = nextId();
    return {
        id: spec.id ?? `source_${seed}`,
        name: spec.name ?? `Source ${seed}`,
        query: spec.query ?? `{job="${seed}"}`,
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
