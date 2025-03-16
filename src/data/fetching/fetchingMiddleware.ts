import { ListenerEffectAPI, createListenerMiddleware } from "@reduxjs/toolkit";
import { SourceFetchingState, fetchingActions } from "./fetchingSlice";
import { AppDispatch, RootState } from "../redux/store";
import { buildLokiUrl } from "@/lib/utils";
import axios from "axios";
import { receiveBatch } from "../redux/logDataSlice";
import { Log } from "../schema";
import { createNewSource, deleteSource } from "../redux/sourcesSlice";

const REFETCH_DELAY = 60000;

const fetchingMiddleware = createListenerMiddleware()
export default fetchingMiddleware

fetchingMiddleware.startListening({
    actionCreator: fetchingActions.startFetching,
    effect: async (action, listenerApi) => {
        for (const source of Object.values((listenerApi.getState() as RootState).sources.data)) {
            if (!source.active) {
                continue
            }
            listenerApi.dispatch(fetchingActions.initSourceFetching({
                source,
                from: action.payload.from,
            }))
        }

        //TODO: before declaring released, need to sort out working with mutating sources
        const task = listenerApi.fork(async (forkApi) => {
            while (true) {
                const fetchingState = (listenerApi.getState() as RootState).fetching
                if (fetchingState.overallState.status === 'idle') {
                    break
                }

                for (const sourceState of Object.values(fetchingState.sourcesState)) {
                    try {
                        await processSourceFetching(sourceState, listenerApi as ListenerEffectAPI<RootState, AppDispatch>)
                    } catch (e: unknown) {
                        const errMessage = e instanceof Error ? e.message : JSON.stringify(e);
                        console.error('unexpected middleware error fetching source', e)
                        listenerApi.dispatch(fetchingActions.sourceFetchErr({
                            sourceId: sourceState.sourceId,
                            err: errMessage,
                        }))
                    }
                }
                await forkApi.delay(REFETCH_DELAY) //polling every minute after the last fetch
            }
        })
        await task.result
    },
})

fetchingMiddleware.startListening({
    actionCreator: createNewSource,
    effect: (_action, listenerApi) => {
        const beforeSources = (listenerApi.getOriginalState() as RootState).sources.data;
        const afterSources = (listenerApi.getState() as RootState).sources.data;
        const newSource = Object.values(afterSources).find(source => !beforeSources[source.id])
        if (!newSource) {
            return
        }
        if (!newSource.active) { //TODO: this needs to be tested.
            return
        }
        listenerApi.dispatch(fetchingActions.initSourceFetching({
            source: newSource,
            from: new Date().toISOString(),
        }))
    },
})

fetchingMiddleware.startListening({
    actionCreator: deleteSource,
    effect: (_action, listenerApi) => {
        const beforeSources = (listenerApi.getOriginalState() as RootState).sources.data;
        const afterSources = (listenerApi.getState() as RootState).sources.data;
        const deletedSource = Object.values(beforeSources).find(source => !afterSources[source.id])
        if (deletedSource) {
            listenerApi.dispatch(fetchingActions.removeSourceFetching(deletedSource.id))
        }
    },
})

async function processSourceFetching(sourceState: SourceFetchingState, listenerApi: ListenerEffectAPI<RootState, AppDispatch>) {

    if (sourceState.state === 'fetching') {
        console.error('source is already fetching', sourceState)
    }
    const source = listenerApi.getState().sources.data[sourceState.sourceId]
    if (!source?.active) {
        return
    }
    let newFetchStart = sourceState.from
    if (sourceState.lastSuccess) {
        const lastSuccessMin5mins = new Date(sourceState.lastSuccess)
        lastSuccessMin5mins.setMinutes(lastSuccessMin5mins.getMinutes() - 5)
        newFetchStart = lastSuccessMin5mins.toISOString()
    }
    const newFetchEnd = new Date()
    listenerApi.dispatch(fetchingActions.startedSourceFetching({
        sourceId: sourceState.sourceId,
        range: {
            from: newFetchStart,
            at: newFetchEnd.toISOString(),
        }
    }))

    try {
        const logs = await fetchLokiLogs({
            query: source.query,
            from: newFetchStart,
            sourceId: source.id,
        })

        //would probably nice somehow move it to the logDataSlice or extract into a separate middleware
        const linePredicates = Object.values(listenerApi.getState().filters.data).map(filter => RegExp(filter.messageRegex))
        for (const log of logs) {
            for (const linePredicate of linePredicates) {
                if (linePredicate.test(log.line)) {                    
                    log.acked = true
                    break
                }
            }
        }

        listenerApi.dispatch(receiveBatch({ logs }));
        listenerApi.dispatch(fetchingActions.sourceFetchedOk(sourceState.sourceId))
    } catch (e: unknown) {
        console.error('error fetching logs', e)
        const errMessage = e instanceof Error ? e.message : JSON.stringify(e);
        listenerApi.dispatch(fetchingActions.sourceFetchErr({
            sourceId: sourceState.sourceId,
            err: errMessage,
        }))
    }

}

async function fetchLokiLogs(params: { query: string, from: string, sourceId: string }) {
    const url = buildLokiUrl(params.query, params.from);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return axios.get<{data: {result: any[]} }>(url, /*{timeout: 1000}*/)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .then(response => response.data.data.result.map((l: any) => ({
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            stream: { ...l.stream },
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            id: l.values?.[0]?.[0].toString(),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
            line: l.values?.[0]?.[1],
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
            timestamp: new Date(parseInt(l.values?.[0]?.[0].slice(0, -6))).toISOString(),
            sourceId: params.sourceId,
            acked: false,
        } as Log)));
}
