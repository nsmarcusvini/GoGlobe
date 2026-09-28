import { describe, expect, it } from "vitest";
import { extractExcerpt } from "./excerpt";

const page = [
  "7 for speaking International English Language Testing System (IELTS Academic)",
  "The department accepts IELTS test results that include",
  "In each of the 4 test components, at least:",
  "6 for listening",
  "6 for reading",
  "6 for writing",
  "6 for speaking",
  "International English Language Testing System (IELTS General Training)",
].join("\n");

describe("extractExcerpt", () => {
  it("copies the IELTS Academic block verbatim", () => {
    expect(extractExcerpt(page)).toEqual([
      "International English Language Testing System (IELTS Academic)",
      "In each of the 4 test components, at least:",
      "6 for listening",
      "6 for reading",
      "6 for writing",
      "6 for speaking",
    ]);
  });

  it("returns null when the page layout changed", () => {
    expect(
      extractExcerpt(
        "International English Language Testing System (IELTS Academic)\nScores vary.",
      ),
    ).toBeNull();
    expect(extractExcerpt("Nothing here")).toBeNull();
    expect(extractExcerpt(page.replace("6 for writing", "see table"))).toBeNull();
  });
});
