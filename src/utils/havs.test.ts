import dayjs from "dayjs";
import {
  groupHavsByDate,
  HavStub,
  isWithinSameHour,
  processHavs,
  fixDurations,
} from "./havs";

const havs: HavStub[] = [
  // 10 HAV stubs within 1 hour of each other (starting from 9:00 AM)
  {
    imu_level: "low",
    timestamp: new Date("2023-09-02T09:00:00Z"),
    duration: 10,
    userId: "123",
  },
  {
    imu_level: "medium",
    timestamp: new Date("2023-09-02T09:05:00Z"),
    duration: 15,
    userId: "123",
  },
  {
    imu_level: "high",
    timestamp: new Date("2023-09-02T09:10:00Z"),
    duration: 20,
    userId: "123",
  },
  {
    imu_level: "extreme",
    timestamp: new Date("2023-09-02T09:15:00Z"),
    duration: 25,
    userId: "123",
  },
  {
    imu_level: "low",
    timestamp: new Date("2023-09-02T09:20:00Z"),
    duration: 30,
    userId: "123",
  },
  {
    imu_level: "medium",
    timestamp: new Date("2023-09-02T09:25:00Z"),
    duration: 12,
    userId: "123",
  },
  {
    imu_level: "high",
    timestamp: new Date("2023-09-02T09:30:00Z"),
    duration: 18,
    userId: "123",
  },
  {
    imu_level: "extreme",
    timestamp: new Date("2023-09-02T09:35:00Z"),
    duration: 22,
    userId: "123",
  },
  {
    imu_level: "low",
    timestamp: new Date("2023-09-02T09:40:00Z"),
    duration: 28,
    userId: "123",
  },
  {
    imu_level: "medium",
    timestamp: new Date("2023-09-02T09:45:00Z"),
    duration: 32,
    userId: "123",
  },

  // 10 HAV stubs at random times throughout the day
  {
    imu_level: "high",
    timestamp: new Date("2023-09-02T00:15:00Z"),
    duration: 14,
    userId: "123",
  },
  {
    imu_level: "extreme",
    timestamp: new Date("2023-09-02T02:30:00Z"),
    duration: 16,
    userId: "123",
  },
  {
    imu_level: "low",
    timestamp: new Date("2023-09-02T05:45:00Z"),
    duration: 20,
    userId: "123",
  },
  {
    imu_level: "medium",
    timestamp: new Date("2023-09-02T08:00:00Z"),
    duration: 18,
    userId: "123",
  },
  {
    imu_level: "high",
    timestamp: new Date("2023-09-02T11:20:00Z"),
    duration: 15,
    userId: "123",
  },
  {
    imu_level: "extreme",
    timestamp: new Date("2023-09-02T13:55:00Z"),
    duration: 10,
    userId: "123",
  },
  {
    imu_level: "low",
    timestamp: new Date("2023-09-02T16:10:00Z"),
    duration: 25,
    userId: "123",
  },
  {
    imu_level: "medium",
    timestamp: new Date("2023-09-02T19:35:00Z"),
    duration: 30,
    userId: "123",
  },
  {
    imu_level: "high",
    timestamp: new Date("2023-09-02T21:50:00Z"),
    duration: 35,
    userId: "123",
  },
  {
    imu_level: "extreme",
    timestamp: new Date("2023-09-02T23:00:00Z"),
    duration: 40,
    userId: "123",
  },
];

describe("isWithinSameHour", () => {
  it("should return true for dates within the same hour", () => {
    const date1 = new Date("2023-09-02T12:30:00");
    const date2 = new Date("2023-09-02T12:45:00");
    expect(isWithinSameHour(date1, date2)).toBe(true);
  });

  it("should return false for dates in different hours", () => {
    const date1 = new Date("2023-09-02T12:30:00");
    const date2 = new Date("2023-09-02T13:00:00");
    expect(isWithinSameHour(date1, date2)).toBe(false);
  });

  it("should return false for dates that are in the same minute but different hours", () => {
    const date1 = new Date("2023-09-02T11:59:59");
    const date2 = new Date("2023-09-02T12:00:00");
    expect(isWithinSameHour(date1, date2)).toBe(false);
  });

  it("should return false if firstDate is invalid", () => {
    const date1 = new Date("invalid date");
    const date2 = new Date("2023-09-02T12:00:00");
    expect(isWithinSameHour(date1, date2)).toBe(false);
  });

  it("should return false if secondDate is invalid", () => {
    const date1 = new Date("2023-09-02T12:00:00");
    const date2 = new Date("invalid date");
    expect(isWithinSameHour(date1, date2)).toBe(false);
  });

  it("should handle time zones correctly", () => {
    const date1 = new Date("2023-09-02T12:00:00Z"); // UTC time
    const date2 = new Date("2023-09-02T12:00:00+01:00"); // UTC+1 time zone
    expect(isWithinSameHour(date1, date2)).toBe(false);
  });
});

describe("groupHavsByDate", () => {
  const havs: HavStub[] = [
    {
      imu_level: "low",
      timestamp: new Date("2023-09-02T12:00:00"),
      duration: 30,
      userId: "123",
    },
    {
      imu_level: "medium",
      timestamp: new Date("2023-09-02T12:15:00"),
      duration: 30,
      userId: "123",
    },
    {
      imu_level: "high",
      timestamp: new Date("2023-09-02T13:00:00"),
      duration: 30,
      userId: "123",
    },
    {
      imu_level: "extreme",
      timestamp: new Date("2023-09-02T14:00:00"),
      duration: 30,
      userId: "123",
    },
  ];

  it("should return an empty array if input is empty", () => {
    expect(groupHavsByDate([])).toEqual([]);
  });

  it("should group havs within the same hour together", () => {
    const groupedHavs = groupHavsByDate(havs);
    expect(groupedHavs.length).toBe(3);
    expect(groupedHavs[0]).toEqual([havs[0], havs[1]]);
    expect(groupedHavs[1]).toEqual([havs[2]]);
    expect(groupedHavs[2]).toEqual([havs[3]]);
  });

  it("should handle a single HavStub entry correctly", () => {
    const singleHav: HavStub[] = [
      {
        imu_level: "low",
        timestamp: new Date("2023-09-02T12:00:00"),
        duration: 30,
        userId: "123",
      },
    ];

    const groupedHavs = groupHavsByDate(singleHav);
    expect(groupedHavs.length).toBe(1);
    expect(groupedHavs[0]).toEqual(singleHav);
  });

  it("should handle entries exactly on the hour boundary", () => {
    const boundaryHavs: HavStub[] = [
      {
        imu_level: "low",
        timestamp: new Date("2023-09-02T12:59:59"),
        duration: 30,
        userId: "123",
      },
      {
        imu_level: "medium",
        timestamp: new Date("2023-09-02T13:00:00"),
        duration: 30,
        userId: "123",
      },
    ];

    const groupedHavs = groupHavsByDate(boundaryHavs);
    expect(groupedHavs.length).toBe(2);
    expect(groupedHavs[0]).toEqual([boundaryHavs[0]]);
    expect(groupedHavs[1]).toEqual([boundaryHavs[1]]);
  });

  it("should handle non-sorted input gracefully (assuming it is sorted)", () => {
    const nonSortedHavs: HavStub[] = [
      {
        imu_level: "medium",
        timestamp: new Date("2023-09-02T13:15:00"),
        duration: 30,
        userId: "123",
      },
      {
        imu_level: "low",
        timestamp: new Date("2023-09-02T12:00:00"),
        duration: 30,
        userId: "123",
      },
    ];

    const groupedHavs = groupHavsByDate(nonSortedHavs);
    // Expecting it to create two groups since the function assumes sorted input
    expect(groupedHavs.length).toBe(2);
    expect(groupedHavs[0]).toEqual([nonSortedHavs[0]]);
    expect(groupedHavs[1]).toEqual([nonSortedHavs[1]]);
  });
});

describe("fixDurations", () => {
  // Test Case 1: Extreme lasts for 60 seconds, all others should be reduced to 0
  test("should return Low 0s, Medium 0s, High 0s, Extreme 60s", () => {
    const havs1: HavStub[][] = [
      [
        {
          imu_level: "low",
          timestamp: new Date("2023-09-02T09:00:00Z"),
          duration: 60,
          userId: "123",
        },
        {
          imu_level: "medium",
          timestamp: new Date("2023-09-02T09:05:00Z"),
          duration: 60,
          userId: "123",
        },
        {
          imu_level: "high",
          timestamp: new Date("2023-09-02T09:10:00Z"),
          duration: 60,
          userId: "123",
        },
        {
          imu_level: "extreme",
          timestamp: new Date("2023-09-02T09:15:00Z"),
          duration: 60,
          userId: "123",
        },
      ],
    ];

    const result = fixDurations(havs1);

    expect(result.length).toBe(4);
    expect(result.find((hav) => hav.imu_level === "low")?.duration).toBe(0);
    expect(result.find((hav) => hav.imu_level === "medium")?.duration).toBe(0);
    expect(result.find((hav) => hav.imu_level === "high")?.duration).toBe(0);
    expect(result.find((hav) => hav.imu_level === "extreme")?.duration).toBe(
      60,
    );
  });

  // Test Case 2: Low starts for 30s and goes to Extreme for 30s, expect: Low 30s, Medium 0s, High 0s, Extreme 30s
  test("should return Low 30s, Medium 0s, High 0s, Extreme 30s when Low starts for 30s and goes to Extreme for 30s", () => {
    const havs2: HavStub[][] = [
      [
        {
          imu_level: "low",
          timestamp: new Date("2023-09-02T09:00:00Z"),
          duration: 30,
          userId: "123",
        },

        {
          imu_level: "medium",
          timestamp: new Date("2023-09-02T09:00:00Z"),
          duration: 0,
          userId: "123",
        },
        {
          imu_level: "extreme",
          timestamp: new Date("2023-09-02T09:30:00Z"),
          duration: 30,
          userId: "123",
        },
      ],
    ];

    const result = fixDurations(havs2);

    expect(result.length).toBe(4);
    expect(result.find((hav) => hav.imu_level === "low")?.duration).toBe(30);
    expect(result.find((hav) => hav.imu_level === "medium")?.duration).toBe(0);
    expect(result.find((hav) => hav.imu_level === "high")?.duration).toBe(0);
    expect(result.find((hav) => hav.imu_level === "extreme")?.duration).toBe(
      30,
    );
  });

  // Test Case 3: Low 10s, Medium 10s, High 10s, Extreme 10s -> Low 10s, Medium 10s, High 10s, Extreme 10s
  test("should return Low 10s, Medium 10s, High 10s, Extreme 10s when all levels change after every 10s", () => {
    const havs3: HavStub[][] = [
      [
        {
          imu_level: "low",
          timestamp: new Date("2023-09-02T09:00:00Z"),
          duration: 40,
          userId: "123",
        },
        {
          imu_level: "medium",
          timestamp: new Date("2023-09-02T09:10:00Z"),
          duration: 30,
          userId: "123",
        },
        {
          imu_level: "high",
          timestamp: new Date("2023-09-02T09:20:00Z"),
          duration: 20,
          userId: "123",
        },
        {
          imu_level: "extreme",
          timestamp: new Date("2023-09-02T09:30:00Z"),
          duration: 10,
          userId: "123",
        },
      ],
    ];

    const result = fixDurations(havs3);

    expect(result.length).toBe(4);
    expect(result.find((hav) => hav.imu_level === "low")?.duration).toBe(10);
    expect(result.find((hav) => hav.imu_level === "medium")?.duration).toBe(10);
    expect(result.find((hav) => hav.imu_level === "high")?.duration).toBe(10);
    expect(result.find((hav) => hav.imu_level === "extreme")?.duration).toBe(
      10,
    );
  });
});
