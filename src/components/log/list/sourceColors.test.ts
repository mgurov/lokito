import { expect, test } from "vitest";
import { sourcesLineStyle } from "./SourceButtons";

test("one color", () => {
  expect(sourcesLineStyle([{ color: "red" }])).toStrictEqual({
    background: "red",
  });
});

test("two colors", () => {
  expect(sourcesLineStyle([
    { color: "red" },
    { color: "blue" },
  ])).toStrictEqual({
    background: "linear-gradient(0deg,red 0%,blue 100%)",
  });
});

test("three colors", () => {
  expect(sourcesLineStyle([
    { color: "red" },
    { color: "yellow" },
    { color: "blue" },
  ])).toStrictEqual({
    background: "linear-gradient(0deg,red 0%,yellow 50%,blue 100%)",
  });
});

test("four colors", () => {
  expect(sourcesLineStyle([
    { color: "red" },
    { color: "yellow" },
    { color: "green" },
    { color: "blue" },
  ])).toStrictEqual({
    background: "linear-gradient(0deg,red 0%,yellow 33.333333333333336%,green 66.66666666666667%,blue 100%)",
  });
});
