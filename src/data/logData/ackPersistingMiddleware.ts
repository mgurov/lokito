import { createListenerMiddleware } from "@reduxjs/toolkit";
import ackPersistence from "../logData/ackPersistence";
import { logDataSliceActions } from "../logData/logDataSlice";
import { RootState } from "../redux/store";

const ackPersistingMiddleware = createListenerMiddleware();
export default ackPersistingMiddleware;

ackPersistingMiddleware.startListening({
  predicate: (_action, currentState) => {
    const logDataState = (currentState as RootState).logData;
    return logDataState.justAcked.size > 0;
  },
  effect: async (_action, listenerApi) => {
    const { justAcked } = (listenerApi.getState() as RootState).logData;
    await ackPersistence.markAcked(justAcked);
    listenerApi.dispatch(logDataSliceActions.cleanAcked(new Set(justAcked)));
  },
});

ackPersistingMiddleware.startListening({
  predicate: (_action, currentState) => {
    const logDataState = (currentState as RootState).logData;
    return logDataState.justUnacked.size > 0;
  },
  effect: async (_action, listenerApi) => {
    const { justUnacked } = (listenerApi.getState() as RootState).logData;
    await ackPersistence.unmarkAcked(justUnacked);
    listenerApi.dispatch(logDataSliceActions.cleanUnacked(new Set(justUnacked)));
  },
});
