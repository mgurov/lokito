import { isAckPersistenceEnabled } from "@/components/config/LoadedConfigurationContext";
import { DBSchema, IDBPObjectStore, openDB } from "idb";

export async function isAcked(logId: string) {
  if (!isAckPersistenceEnabled()) {
    return false;
  }
  const db = await openOurDb();
  const result = await db.get(ackedObjectStore, logId);
  return result !== undefined;
}

export async function markAcked(logIds: Set<string>) {
  await operateOnLogIds(logIds, (store, logId) => store.put(true, logId));
}

export async function unmarkAcked(logIds: Set<string>) {
  await operateOnLogIds(logIds, (store, logId) => store.delete(logId));
}

async function operateOnLogIds(
  logIds: Set<string>,
  op: (store: IDBPObjectStore<MyDB, ["acked"], "acked", "readwrite">, logId: string) => Promise<void | string>,
) {
  if (!isAckPersistenceEnabled()) {
    return;
  }
  const db = await openOurDb();
  const tx = db.transaction(ackedObjectStore, "readwrite");
  const store = tx.objectStore(ackedObjectStore);
  for (const logId of logIds) {
    await op(store, logId);
  }
  await tx.done;
}

export default {
  isAcked,
  markAcked,
  unmarkAcked,
};

const lokitoDb = "lokito";
const ackedObjectStore = "acked";

interface MyDB extends DBSchema {
  [ackedObjectStore]: {
    key: string;
    value: true;
  };
}

async function openOurDb() {
  return openDB<MyDB>(lokitoDb, 1, {
    upgrade: function upgrade(db) {
      db.createObjectStore(ackedObjectStore);
    },
  });
}
