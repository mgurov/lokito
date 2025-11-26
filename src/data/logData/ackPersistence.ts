import { isAckPersistenceEnabled } from "@/components/config/LoadedConfigurationContext";
import { DBSchema, openDB } from "idb";

// TODO: check the id is time-growing
export async function isAcked(logId: string) {
  if (!isAckPersistenceEnabled()) {
    return false;
  }
  const db = await openOurDb();
  const result = await db.get(ackedObjectStore, logId);
  return result !== undefined;
}

export async function markAcked(logIds: string[]) {
  if (!isAckPersistenceEnabled()) {
    return;
  }
  const db = await openOurDb();
  const tx = db.transaction(ackedObjectStore, "readwrite");
  const store = tx.objectStore(ackedObjectStore);

  for (const logId of logIds) {
    await store.put(true, logId);
  }
  await tx.done;
}

export async function unmarkAcked(logIds: string[]) {
  if (!isAckPersistenceEnabled()) {
    return;
  }
  const db = await openOurDb();
  const tx = db.transaction(ackedObjectStore, "readwrite");
  const store = tx.objectStore(ackedObjectStore);
  for (const logId of logIds) {
    await store.delete(logId);
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
