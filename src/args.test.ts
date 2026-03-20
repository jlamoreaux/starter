import { describe, expect, test } from "bun:test";
import { getFlagValue } from "./args";

describe("getFlagValue", () => {
  describe("flag not present", () => {
    test("returns undefined when args is empty", () => {
      expect(getFlagValue([], "--template")).toBeUndefined();
    });

    test("returns undefined when flag is not in args", () => {
      expect(getFlagValue(["my-app", "--yes"], "--template")).toBeUndefined();
    });

    test("returns undefined when a different flag is present", () => {
      expect(getFlagValue(["--features", "tailwind"], "--template")).toBeUndefined();
    });
  });

  describe("--flag value form (space-separated)", () => {
    test("returns value when flag is followed by a value", () => {
      expect(getFlagValue(["--template", "nextjs"], "--template")).toBe("nextjs");
    });

    test("returns value when flag appears after other args", () => {
      expect(getFlagValue(["my-app", "--template", "tanstack-start"], "--template")).toBe(
        "tanstack-start"
      );
    });

    test("returns value when flag appears before other flags", () => {
      expect(getFlagValue(["--template", "nextjs", "--yes"], "--template")).toBe("nextjs");
    });

    test("throws when flag is last arg with no value", () => {
      expect(() => getFlagValue(["--template"], "--template")).toThrow(
        "Flag --template requires a value"
      );
    });

    test("throws when next token is another flag", () => {
      expect(() => getFlagValue(["--template", "--yes"], "--template")).toThrow(
        "Flag --template requires a value"
      );
    });
  });

  describe("--flag=value form (equals-separated)", () => {
    test("returns value with = form", () => {
      expect(getFlagValue(["--template=nextjs"], "--template")).toBe("nextjs");
    });

    test("returns empty string for --flag= (explicit empty)", () => {
      expect(getFlagValue(["--bindings="], "--bindings")).toBe("");
    });

    test("returns value with = form alongside other args", () => {
      expect(getFlagValue(["my-app", "--template=tanstack-start", "--yes"], "--template")).toBe(
        "tanstack-start"
      );
    });
  });

  describe("multiple flag aliases", () => {
    test("returns value when first alias matches", () => {
      expect(getFlagValue(["--template", "nextjs"], "--template", "-t")).toBe("nextjs");
    });

    test("returns value when second alias matches", () => {
      expect(getFlagValue(["-t", "nextjs"], "--template", "-t")).toBe("nextjs");
    });

    test("returns undefined when neither alias is present", () => {
      expect(getFlagValue(["--yes"], "--template", "-t")).toBeUndefined();
    });
  });

  describe("edge cases", () => {
    test("does not confuse a value that starts with -- in = form", () => {
      // --flag=--something is unusual but technically valid in = form
      expect(getFlagValue(["--template=--weird"], "--template")).toBe("--weird");
    });

    test("handles multiple occurrences — returns first match", () => {
      // First flag wins
      expect(
        getFlagValue(["--template", "nextjs", "--template", "tanstack-start"], "--template")
      ).toBe("nextjs");
    });
  });
});
