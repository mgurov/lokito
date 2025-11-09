import { buildLokiUrl, LokiUrlParams } from "@/lib/utils";
import { createListenerMiddleware, ListenerEffectAPI } from "@reduxjs/toolkit";
import axios from "axios";
import { receiveBatch } from "../logData/logDataSlice";
import { JustReceivedLog } from "../logData/logSchema";
import { createNewSource, deleteSource } from "../redux/sourcesSlice";
import { AppDispatch, RootState } from "../redux/store";
import { SourceLocalStorage } from "../source";
import { fetchingActions, SourceFetchingState, START_WHERE_STOPPED } from "./fetchingSlice";

const REFETCH_DELAY = 60000;

const fetchingMiddleware = createListenerMiddleware();
export default fetchingMiddleware;

fetchingMiddleware.startListening({
  actionCreator: fetchingActions.startFetching,
  effect: async (action, listenerApi) => {
    for (const source of Object.values((listenerApi.getState() as RootState).sources.data)) {
      if (!source.active) {
        continue;
      }

      let from = action.payload.from;
      if (from === START_WHERE_STOPPED) {
        const lastUpdate = SourceLocalStorage.lastSuccessFrom.load(source.id);
        if (null === lastUpdate) {
          from = (new Date()).toISOString();
        } else {
          from = lastUpdate;
        }
      }

      listenerApi.dispatch(fetchingActions.initSourceFetching({
        source,
        from,
      }));
    }

    const task = listenerApi.fork(async (forkApi) => {
      while (true) {
        listenerApi.dispatch(fetchingActions.incrementFetchCycle());

        const fetchingState = (listenerApi.getState() as RootState).fetching;
        if (fetchingState.overallState.status === "idle") {
          break;
        }

        for (const sourceState of Object.values(fetchingState.sourcesState)) {
          try {
            await processSourceFetching(sourceState, listenerApi as ListenerEffectAPI<RootState, AppDispatch>);
          } catch (e: unknown) {
            const errMessage = e instanceof Error ? e.message : JSON.stringify(e);
            console.error("unexpected middleware error fetching source", e);
            listenerApi.dispatch(fetchingActions.sourceFetchErr({
              sourceId: sourceState.sourceId,
              err: errMessage,
            }));
          }
        }
        await forkApi.delay(REFETCH_DELAY); // polling every minute after the last fetch
      }
    });
    await task.result;
  },
});

fetchingMiddleware.startListening({
  actionCreator: createNewSource,
  effect: (_action, listenerApi) => {
    const beforeSources = (listenerApi.getOriginalState() as RootState).sources.data;
    const afterSources = (listenerApi.getState() as RootState).sources.data;
    const newSource = Object.values(afterSources).find(source => !beforeSources[source.id]);
    if (!newSource) {
      return;
    }
    if (!newSource.active) {
      return;
    }
    listenerApi.dispatch(fetchingActions.initSourceFetching({
      source: newSource,
      from: new Date().toISOString(),
    }));
  },
});

fetchingMiddleware.startListening({
  actionCreator: deleteSource,
  effect: (_action, listenerApi) => {
    const beforeSources = (listenerApi.getOriginalState() as RootState).sources.data;
    const afterSources = (listenerApi.getState() as RootState).sources.data;
    const deletedSource = Object.values(beforeSources).find(source => !afterSources[source.id]);
    if (deletedSource) {
      listenerApi.dispatch(fetchingActions.removeSourceFetching(deletedSource.id));
    }
  },
});

async function processSourceFetching(
  sourceState: SourceFetchingState,
  listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
) {
  if (sourceState.state === "fetching") {
    console.error("source is already fetching", sourceState);
  }
  const source = listenerApi.getState().sources.data[sourceState.sourceId];
  if (!source?.active) {
    return;
  }
  let newFetchStart = sourceState.from;
  if (sourceState.lastSuccess) {
    const lastSuccessMin5mins = new Date(sourceState.lastSuccess);
    lastSuccessMin5mins.setMinutes(lastSuccessMin5mins.getMinutes() - 5);
    newFetchStart = lastSuccessMin5mins.toISOString();
  }
  const newFetchEnd = new Date();
  listenerApi.dispatch(fetchingActions.startedSourceFetching({
    sourceId: sourceState.sourceId,
    range: {
      from: newFetchStart,
      at: newFetchEnd.toISOString(),
    },
  }));

  try {
    const { datasource } = source;
    if (!datasource) {
      throw new Error("No datasource configured for source " + JSON.stringify(source));
    }
    const logs = await fetchLokiLogs({
      query: source.query,
      start: newFetchStart,
      datasourceId: datasource,
    });

    listenerApi.dispatch(receiveBatch({
      logs,
      filters: Object.values(listenerApi.getState().filters.data),
      sourceId: source.id,
      fetchCycle: listenerApi.getState().fetching.overallState.fetchCycle,
    }));
    listenerApi.dispatch(fetchingActions.sourceFetchedOk({
      sourceId: sourceState.sourceId,
      from: newFetchStart,
    }));
  } catch (e: unknown) {
    console.error("error fetching logs", e);
    const errMessage = e instanceof Error ? e.message : JSON.stringify(e);
    listenerApi.dispatch(fetchingActions.sourceFetchErr({
      sourceId: sourceState.sourceId,
      err: errMessage,
    }));
  }
}

async function fetchLokiLogs(params: LokiUrlParams) {
  const url = buildLokiUrl(params);

  const response = await axios.get<{ data: { result: LokiResponseEntry[] } }>(url);

  return Promise.all(
    response.data.data.result.map(responseEntryToJustReceivedLog),
  );
}

async function responseEntryToJustReceivedLog(l: LokiResponseEntry): Promise<JustReceivedLog> {
  const [[ts, line]] = l.values;
  const streamHash = await computeSHA256(JSON.stringify(l.stream));
  const id = ts.toString() + "_" + streamHash;
  const result = {
    id,
    stream: { ...l.stream },
    timestamp: new Date(parseInt(ts.slice(0, -6))).toISOString(),
    message: line,
  };
  return result;
}

type LokiResponseEntry = {
  values: [[timestamp: string, messageLine: string]];
  stream: Record<string, string>;
};

export async function computeSHA256(input: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  return hashHex;
}
