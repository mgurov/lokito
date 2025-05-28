import { Source } from "@/data/source";
import { nextId } from "../util/nextId";
import { StorageFixture, storageTest } from "./StorageFixture";
import { Filter } from "@/data/filters/filter";

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
    
    //NB: discards other filters
    async givenFilter(spec: FilterSpec) {
        return this.givenFilters(spec)
    }

    //NB: discards other filters
    async givenFilters(...specs: FilterSpec[]) {
        const filters = specs.map(filterFromSpec)
        await this.storage.setLocalItem('filters', filters);
        return filters;
    }
}

type FilterSpec = string | Partial<Filter>;

function filterFromSpec(spec: FilterSpec): Filter {

    const template: Filter = {
        id: nextId(),
        messageRegex: 'dont much nobody',
        transient: false,
        autoAckTillDate: undefined,
    }

    if (typeof(spec) === 'string') {
        template.messageRegex = spec
        return template
    }
    
    return {...template, ...spec}
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
