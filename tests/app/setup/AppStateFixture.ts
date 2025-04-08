import { Source } from "@/data/source";
import { nextId } from "../util/nextId";
import { StorageFixture, storageTest } from "./StorageFixture";

export class AppStateFixture {
    constructor(public storage: StorageFixture) {
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
    async givenSource(sourceSpecs: SourceSpec = {}) {
        const [source] = await this.givenSources(...[sourceSpecs]);
        return source
    }

    async givenSources(...sourceSpecs: SourceSpec[]) {
        const sources = sourceSpecs.map(toSource);
        await this.storage.setLocalItem('sources', sources);
        return sources;
    }
    
    //NB: discards other sources
    async givenFilter(messageRegex: string) {
        const seed = nextId();
        const filter = {
            id: seed,
            messageRegex,
            transient: false,
        }

        await this.storage.setLocalItem('filters', [filter]);
        return filter;
    }

    //NB: discards other sources
    async givenFilters(...messageRegex: string[]) {
        const filters = messageRegex.map(messageRegex => ({
            id: nextId(),
            messageRegex,
            transient: false
        }))

        await this.storage.setLocalItem('filters', filters);
        return filters;
    }
}


type SourceSpec = { id?: string; name?: string; query?: string; color?: string; active?: boolean };

function toSource(spec: SourceSpec) {
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
