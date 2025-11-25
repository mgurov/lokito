import { Button } from "@/components/ui/shadcn/button";
import { DBSchema, openDB } from "idb";
import React from "react";

export default function TestIndexedDb() {
  const { err, mutate, inProgress: setInProgress } = useSetCurrentTime();

  const { err: readErr, mutate: readMutate, value, inProgress: getInProgress } = useGetCurrentTime();

  const del = useDeleteCurrentTime();

  return (
    <>
      <div>Value {value}</div>
      <div>
        <Button variant="secondary" onClick={mutate} disabled={setInProgress}>write</Button>{" "}
        <Button variant="secondary" onClick={readMutate} disabled={getInProgress}>read</Button>
        <Button variant="secondary" onClick={del.mutate} disabled={del.inProgress}>delete</Button>
      </div>
      {err && <div>Write error: {JSON.stringify(err, null, 2)}</div>}
      {readErr && <div>Read error: {JSON.stringify(readErr, null, 2)}</div>}
      {del.err && <div>Delete error: {JSON.stringify(del.err, null, 2)}</div>}
    </>
  );
}

function useSetCurrentTime() {
  const [err, setErr] = React.useState<unknown>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [inProgress, setInProgress] = React.useState(false);
  const mutate = () => setAttempt(a => a + 1);

  React.useEffect(() => {
    if (attempt === 0) {
      return;
    }
    async function doSet() {
      setInProgress(true);
      try {
        await writeCurrentTime();
      } catch (e) {
        setErr(e);
      } finally {
        setInProgress(false);
      }
    }
    void doSet();
  }, [attempt, setErr]);

  return { err, mutate, inProgress };
}

function useGetCurrentTime() {
  const [value, setValue] = React.useState<undefined | string>();
  const [err, setErr] = React.useState<unknown>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [inProgress, setInProgress] = React.useState(false);
  const mutate = () => setAttempt(a => a + 1);
  React.useEffect(() => {
    async function doGet() {
      setInProgress(true);
      try {
        setValue(await readCurrentTime());
      } catch (e) {
        setErr(e);
      } finally {
        setInProgress(false);
      }
    }
    void doGet();
  }, [attempt, setErr]);

  return { err, mutate, value, inProgress };
}

function useDeleteCurrentTime() {
  const [err, setErr] = React.useState<unknown>(null);
  const [attempt, setAttempt] = React.useState(0);
  const [inProgress, setInProgress] = React.useState(false);
  const mutate = () => setAttempt(a => a + 1);
  React.useEffect(() => {
    async function doGet() {
      setInProgress(true);
      try {
        await deleteCurrentTime();
      } catch (e) {
        setErr(e);
      } finally {
        setInProgress(false);
      }
    }
    void doGet();
  }, [attempt, setErr]);

  return { err, mutate, inProgress };
}

const key = "this_is_a_key";
const objectstore = "testobjectstore";

interface MyDB extends DBSchema {
  [objectstore]: {
    key: string;
    value: string;
  };
}

async function openDb() {
  return openDB<MyDB>("teststore", 1, {
    upgrade: function upgrade(db) {
      db.createObjectStore("testobjectstore");
    },
  });
}

async function writeCurrentTime(): Promise<void> {
  const db = await openDb();
  await db.put("testobjectstore", new Date().toISOString(), key);
}

async function readCurrentTime(): Promise<string | undefined> {
  const db = await openDb();
  return db.get("testobjectstore", key);
}

async function deleteCurrentTime(): Promise<void> {
  const db = await openDb();
  await db.delete("testobjectstore", key);
}
