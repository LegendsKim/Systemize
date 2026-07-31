import { describe, expect, it } from "vitest";
import {
  bootDuration,
  bootExitMs,
  bootProgressPercent,
  bootStepOffsets,
  gateSplashSteps,
  portalBootSteps,
} from "../boot-sequence";

const sequences = [
  { name: "gate splash", steps: gateSplashSteps, ceilingMs: 5_500 },
  { name: "portal arrival", steps: portalBootSteps, ceilingMs: 10_000 },
] as const;

describe.each(sequences)("$name", ({ steps, ceilingMs }) => {
  it("never holds a visitor for longer than its agreed ceiling", () => {
    // The arrival gets ten seconds at the absolute outside, while the gate splash gets
    // enough time to register without holding the sign-in button for more than 5.5s.
    // This is the test that stops the copy from quietly growing past either ceiling.
    expect(bootDuration(steps) + bootExitMs).toBeLessThanOrEqual(ceilingMs);
  });

  it("is long enough to be read rather than flashed", () => {
    expect(bootDuration(steps)).toBeGreaterThan(2_000);
    for (const step of steps) {
      expect(step.durationMs).toBeGreaterThanOrEqual(600);
    }
  });

  it("schedules one start offset per step, in order, beginning at zero", () => {
    const offsets = bootStepOffsets(steps);

    expect(offsets).toHaveLength(steps.length + 1);
    expect(offsets[0]).toBe(0);
    expect(offsets.at(-1)).toBe(bootDuration(steps));

    for (let index = 1; index < offsets.length; index += 1) {
      expect(offsets[index]!).toBeGreaterThan(offsets[index - 1]!);
    }
  });

  it("fills the rail monotonically and lands on a full bar", () => {
    const percents = steps.map((_, index) => bootProgressPercent(index, steps));

    expect(percents.at(-1)).toBe(100);
    for (let index = 1; index < percents.length; index += 1) {
      expect(percents[index]!).toBeGreaterThan(percents[index - 1]!);
    }
  });

  it("clamps an out-of-range index instead of overflowing the rail", () => {
    expect(bootProgressPercent(-3, steps)).toBe(bootProgressPercent(0, steps));
    expect(bootProgressPercent(99, steps)).toBe(100);
  });

  it("gives every step both a status line and an aside", () => {
    for (const step of steps) {
      expect(step.title.trim().length).toBeGreaterThan(0);
      expect(step.aside.trim().length).toBeGreaterThan(0);
    }
  });
});
