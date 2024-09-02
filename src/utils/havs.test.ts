import dayjs from "dayjs";
import { groupHavsByDate, HavStub, isWithinSameHour } from "./havs";

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
      created_at: new Date("2023-09-02T12:00:00"),
      duration: 30,
    },
    {
      imu_level: "medium",
      created_at: new Date("2023-09-02T12:15:00"),
      duration: 30,
    },
    {
      imu_level: "high",
      created_at: new Date("2023-09-02T13:00:00"),
      duration: 30,
    },
    {
      imu_level: "extreme",
      created_at: new Date("2023-09-02T14:00:00"),
      duration: 30,
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
        created_at: new Date("2023-09-02T12:00:00"),
        duration: 30,
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
        created_at: new Date("2023-09-02T12:59:59"),
        duration: 30,
      },
      {
        imu_level: "medium",
        created_at: new Date("2023-09-02T13:00:00"),
        duration: 30,
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
        created_at: new Date("2023-09-02T13:15:00"),
        duration: 30,
      },
      {
        imu_level: "low",
        created_at: new Date("2023-09-02T12:00:00"),
        duration: 30,
      },
    ];

    const groupedHavs = groupHavsByDate(nonSortedHavs);
    // Expecting it to create two groups since the function assumes sorted input
    expect(groupedHavs.length).toBe(2);
    expect(groupedHavs[0]).toEqual([nonSortedHavs[0]]);
    expect(groupedHavs[1]).toEqual([nonSortedHavs[1]]);
  });
});
