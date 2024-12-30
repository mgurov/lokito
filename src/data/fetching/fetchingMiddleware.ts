import { ListenerEffectAPI, createListenerMiddleware } from "@reduxjs/toolkit";
import { SourceFetchingState, fetchingActions } from "./fetchingSlice";
import { AppDispatch, RootState } from "../redux/store";
import { buildLokiUrl } from "@/lib/utils";
import axios from "axios";
import { receiveBatch } from "../redux/logDataSlice";
import { Log } from "../schema";

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
                source: source,
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
                    await processSourceFetching(sourceState, listenerApi as ListenerEffectAPI<RootState, AppDispatch>, forkApi)
                }
                if (fetchingState.overallState.firstFetchInProgress) {
                    listenerApi.dispatch(fetchingActions.firstFetchCompleted())
                }
                // TODO: move this to state then we can make it configurable like in Grafana
                await forkApi.delay(60000) //polling every minute after the last fetch
            }
        })
        await task.result
    },
})

async function processSourceFetching(sourceState: SourceFetchingState, listenerApi: ListenerEffectAPI<RootState, AppDispatch>, forkApi: any) {
    if (sourceState.state === 'fetching') {
        console.error('source is already fetching', sourceState)
    }
    const source = listenerApi.getState().sources.data[sourceState.sourceId]
    if (!source.active) {
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

        await forkApi.delay(500) //artificial delay to make users appreciate our hard work

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
    } catch (e: any) {
        console.error('error fetching logs', e)
        const errMessage = e.message ?? JSON.stringify(e)
        listenerApi.dispatch(fetchingActions.sourceFetchErr({
            sourceId: sourceState.sourceId,
            err: errMessage,
        }))
    }

}

async function fetchLokiLogs(params: { query: string, from: string, sourceId: string }) {
    const url = buildLokiUrl(params.query, params.from);

    return axios.get(url)
        .then(response => response.data.data.result.map((l: any) => ({
            stream: { ...l.stream },
            id: l.values?.[0]?.[0].toString(),
            line: l.values?.[0]?.[1],
            timestamp: new Date(parseInt(l.values?.[0]?.[0].slice(0, -6))).toISOString(),
            sourceId: params.sourceId,
            acked: false,
        } as Log)))
}
