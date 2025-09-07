import { describe, test, expect } from "vitest";

import { getEstimateBACFromLogs } from "../bac";

describe("bac", () => {
  test("should return expected bac", () => {
    const bac = getEstimateBACFromLogs(
      [
        {
          user_id: 1,
          drink_type: "beer",
          volume_ml: 300,
          alcohol_percentage: "10",
          consumed_at: new Date(),
        },
      ],
      {
        id: 1,
        phone_number: "111",
        gender: "M",
        weight: 80,
      }
    );

    expect(Math.round(bac! * 100) / 100).toEqual(0.42);
  });
});
