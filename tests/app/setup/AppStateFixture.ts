import { configUrl } from "@/config/config-schema";
import { Filter } from "@/data/filters/filter";
import { Source } from "@/data/source";
import { Page, TestDetailsAnnotation } from "@playwright/test";
import { nextId } from "../util/nextId";
import { StorageFixture, storageTest } from "./StorageFixture";

export class AppStateFixture {
  constructor(public storage: StorageFixture) {
  }

  async sourceNames() {
    const sourcesStored = await this.storage.getLocalItem("sources");
    return ((sourcesStored || []) as [{ name: string }]).map(s => s.name);
  }

  async sources() {
    const sourcesStored = await this.storage.getLocalItem("sources");
    return ((sourcesStored || []) as [Source]);
  }

  async givenSource(sourceSpecs: SourceSpec = {}) {
    const [source] = await this.givenSources(...[sourceSpecs]);
    return source;
  }

  private config: { datasources: DatasourceSpec[]; features: Record<string, unknown> } = {
    datasources: [{ id: "default" }],
    features: {},
  };

  givenDatasourcesConfig(...specs: DatasourceSpec[]) {
    this.config.datasources = specs;
  }

  givenFeature(name: string, value: unknown) {
    this.config.features[name] = value;
  }

  async setupConfigRouting(page: Page) {
    await page.route(configUrl, async (route) =>
      route.fulfill({
        json: this.config,
      }));
  }

  private sourcesSet: boolean = false;
  async givenSources(...sourceSpecs: SourceSpec[]) {
    if (this.sourcesSet !== false) {
      throw Error(
        `Sources already set, cummulative support is not implemented. Want to override the defaults? Use TagSuppressDefaultSourceTag.`,
      );
    }
    this.sourcesSet = true;

    const sources = sourceSpecs.map(toSource);
    await this.storage.setLocalItem("sources", sources);
    return sources;
  }

  private filtersSet: boolean = false;
  async givenFilters(...messageRegex: FilterSpec[]) {
    if (this.filtersSet !== false) {
      throw Error(`Filters already set, cummulative filters support is not implemented`);
    }
    this.filtersSet = true;

    const filters: Filter[] = messageRegex.map(specToFilter);
    await this.storage.setLocalItem("filters", filters);
    return filters;
  }
}

type DatasourceSpec = {
  id: string;
  name?: string;
};

type FilterSpec = string | Partial<Filter>;

function specToFilter(spec: FilterSpec): Filter {
  if (typeof spec === "string") {
    return {
      id: nextId(),
      messageRegex: spec,
      captureWholeTrace: true,
      field: undefined,
    };
  }
  const result = {
    id: spec.id ?? nextId(),
    messageRegex: spec.messageRegex ?? "",
    transient: spec.transient,
    autoAck: spec.autoAck,
    autoAckTillDate: spec.autoAckTillDate,
    captureWholeTrace: spec.captureWholeTrace ?? true,
  } as Filter;

  return result;
}

type SourceSpec = {
  id?: string;
  name?: string;
  query?: string;
  color?: string;
  active?: boolean;
  datasource?: string | null;
};

function toSource(spec: SourceSpec) {
  const seed = nextId();
  return Object.assign({
    id: spec.id ?? `source_${seed}`,
    name: spec.name ?? `Source ${seed}`,
    query: spec.query ?? `{job="${seed}"}`,
    color: spec.color ?? "#ff0000",
    active: spec.active ?? true,
  }, spec.datasource === null ? {} : { datasource: spec.datasource || "default" });
}

const suppressDefaultAppStateAnnotation = {
  type: "suppress-default-app-state",
  description:
    "Suppresses the default app state setup (i.e. single pre-created source), allowing for custom app state setup in tests.",
} as TestDetailsAnnotation;
export const AnnotationSuppressDefaultApp = { annotation: suppressDefaultAppStateAnnotation };

export const appStateTest = storageTest.extend<{
  appState: AppStateFixture;
}>({
  appState: [
    async ({ storage, page }, use, testInfo) => {
      const appState = new AppStateFixture(storage);
      if (!testInfo.annotations.find(it => it.type === suppressDefaultAppStateAnnotation.type)) {
        await appState.givenSources({ name: "default", datasource: "default" });
      }
      await appState.setupConfigRouting(page);
      await use(appState);
    },
    { auto: true },
  ],
});
