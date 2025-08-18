import { expect, test } from "vitest";
import { reverseDeleteFromArray } from "./utils";

test("deletes", () => {
  const given = [1, 2];
  reverseDeleteFromArray(given, v => v == 2);
  expect(given).toStrictEqual([1]);
});

test("deletes multipole", () => {
  const given = [1, 2, 1, 2, 1];
  reverseDeleteFromArray(given, v => v == 2);
  expect(given).toStrictEqual([1, 1, 1]);
});

test("deletes multiple sequenced", () => {
  const given = [2, 2, 1, 2, 2, 2, 2, 1, 2, 1, 2, 2, 2];
  reverseDeleteFromArray(given, v => v == 2);
  expect(given).toStrictEqual([1, 1, 1]);
});
