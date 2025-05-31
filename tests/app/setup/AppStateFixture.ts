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


    async givenSource(sourceSpecs: SourceSpec = {}) {
        const [source] = await this.givenSources(...[sourceSpecs]);
        return source
    }

    private sourcesSet: boolean = false;
    async givenSources(...sourceSpecs: SourceSpec[]) {
        if (this.sourcesSet !== false) {
            throw Error(`Sources already set, cummulative support is not implemented. Want to override the defaults? Use TagSuppressDefaultSourceTag.`);
        }
        this.sourcesSet = true

        const sources = sourceSpecs.map(toSource);
        await this.storage.setLocalItem('sources', sources);
        return sources;
    }

    private filtersSet: boolean = false;
    async givenFilters(...messageRegex: FilterSpec[]) {

        if (this.filtersSet !== false) {
            throw Error(`Filters already set, cummulative filters support is not implemented`);
        }
        this.filtersSet = true

        const filters: Filter[] = messageRegex.map(specToFilter)
        await this.storage.setLocalItem('filters', filters);
        return filters;
    }
}

type FilterSpec = string | Partial<Filter>;

function specToFilter(spec: FilterSpec): Filter {
    if (typeof spec === 'string') {
        return {
            id: nextId(),
            messageRegex: spec,
        };
    }
    return {
        id: spec.id ?? nextId(),
        messageRegex: spec.messageRegex ?? '',
        transient: spec.transient,
        autoAck: spec.autoAck,
        autoAckTillDate: spec.autoAckTillDate,
    };
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

export const SuppressDefaultAppStateTag = '@suppress-default-app-state'
export const TagSuppressDefaultAppStateTag = {tag: SuppressDefaultAppStateTag}

export const appStateTest = storageTest.extend<{
    appState: AppStateFixture,
}>({
    appState: [
        async ({ storage}, use, testInfo) => {
            const appState = new AppStateFixture(storage);
            if (!testInfo.tags.includes(SuppressDefaultAppStateTag)) {
                await appState.givenSources({ name: 'default' });
            }
            await use(appState);
        },
        { auto: true },
    ],
});
