import dayjs from "dayjs";

export type ImuLevel = "low" | "medium" | "high" | "extreme";

export interface HavStub {
  imu_level: ImuLevel;
  created_at: Date;
  duration: number;
}

// Imagine that we got a bunch of HAVs, and they are ready to be processed. TICK
// The first step is to group them by their created at date. TICK
// We then map through those groups, and reduce them to a single HAV for each of the imu levels.
// We then, then to go through each group of imu levels, and fix the durations. This would create a list of HAVs ready to be saved.

const havs: HavStub[] = [
  // 10 HAV stubs within 1 hour of each other (starting from 9:00 AM)
  {
    imu_level: "low",
    created_at: new Date("2023-09-02T09:00:00Z"),
    duration: 10,
  },
  {
    imu_level: "medium",
    created_at: new Date("2023-09-02T09:05:00Z"),
    duration: 15,
  },
  {
    imu_level: "high",
    created_at: new Date("2023-09-02T09:10:00Z"),
    duration: 20,
  },
  {
    imu_level: "extreme",
    created_at: new Date("2023-09-02T09:15:00Z"),
    duration: 25,
  },
  {
    imu_level: "low",
    created_at: new Date("2023-09-02T09:20:00Z"),
    duration: 30,
  },
  {
    imu_level: "medium",
    created_at: new Date("2023-09-02T09:25:00Z"),
    duration: 12,
  },
  {
    imu_level: "high",
    created_at: new Date("2023-09-02T09:30:00Z"),
    duration: 18,
  },
  {
    imu_level: "extreme",
    created_at: new Date("2023-09-02T09:35:00Z"),
    duration: 22,
  },
  {
    imu_level: "low",
    created_at: new Date("2023-09-02T09:40:00Z"),
    duration: 28,
  },
  {
    imu_level: "medium",
    created_at: new Date("2023-09-02T09:45:00Z"),
    duration: 32,
  },

  // 10 HAV stubs at random times throughout the day
  {
    imu_level: "high",
    created_at: new Date("2023-09-02T00:15:00Z"),
    duration: 14,
  },
  {
    imu_level: "extreme",
    created_at: new Date("2023-09-02T02:30:00Z"),
    duration: 16,
  },
  {
    imu_level: "low",
    created_at: new Date("2023-09-02T05:45:00Z"),
    duration: 20,
  },
  {
    imu_level: "medium",
    created_at: new Date("2023-09-02T08:00:00Z"),
    duration: 18,
  },
  {
    imu_level: "high",
    created_at: new Date("2023-09-02T11:20:00Z"),
    duration: 15,
  },
  {
    imu_level: "extreme",
    created_at: new Date("2023-09-02T13:55:00Z"),
    duration: 10,
  },
  {
    imu_level: "low",
    created_at: new Date("2023-09-02T16:10:00Z"),
    duration: 25,
  },
  {
    imu_level: "medium",
    created_at: new Date("2023-09-02T19:35:00Z"),
    duration: 30,
  },
  {
    imu_level: "high",
    created_at: new Date("2023-09-02T21:50:00Z"),
    duration: 35,
  },
  {
    imu_level: "extreme",
    created_at: new Date("2023-09-02T23:00:00Z"),
    duration: 40,
  },
];

export function groupHavsByDate(havs: HavStub[]): HavStub[][] {
  if (havs.length === 0) return [];

  havs.sort((a, b) => a.created_at.getTime() - b.created_at.getTime());

  const groupedHavs: HavStub[][] = [];
  let currentGroup: HavStub[] = [];

  havs.forEach((currentHav, index) => {
    if (index === 0) {
      currentGroup.push(currentHav);
      return;
    }

    const previousHav = havs[index - 1];

    if (isWithinSameHour(currentHav.created_at, previousHav.created_at)) {
      currentGroup.push(currentHav);
    } else {
      groupedHavs.push(currentGroup);
      currentGroup = [currentHav];
    }
  });

  // Add the last group
  if (currentGroup.length) {
    groupedHavs.push(currentGroup);
  }

  return groupedHavs;
}

export function isWithinSameHour(firstDate: Date, secondDate: Date): boolean {
  return dayjs(firstDate).isSame(secondDate, "hour");
}

export function aggregateHavsByIMU(havs: HavStub[][]): HavStub[][] {
  const imuLevels = ["low", "medium", "high", "extreme"] as ImuLevel[];

  return havs.map((group) => {
    return imuLevels.map((level) => {
      const filteredGroup = group.filter((hav) => hav.imu_level === level);

      if (filteredGroup.length === 0) {
        // If there are no HAVs for this level, return an object with 0 duration and a default created_at date
        return {
          imu_level: level,
          created_at: new Date(0), // Default to epoch time, could be customized
          duration: 0,
        };
      }

      const earliestCreatedAt = filteredGroup.reduce((earliest, current) => {
        return current.created_at < earliest.created_at ? current : earliest;
      });

      const totalDuration = filteredGroup.reduce(
        (sum, current) => sum + current.duration,
        0,
      );

      return {
        imu_level: level,
        created_at: earliestCreatedAt.created_at,
        duration: totalDuration,
      };
    });
  });
}

export function fixDurations(havs: HavStub[][]): HavStub[] {
  const fixedHavs: HavStub[] = [];

  havs.map((group) => {
    /**
   [02/09/2024, 13:45:11] Ian: Like let’s say someone was on extreme for 60 seconds, what events will I get?
   >Low 60s
   >Medium 60s
   >High 60s
   >Extreme 60s
Is it going to be four events (low, medium, high, extreme) all at 60 seconds?
   >yse
What about if it starts low for 30s and goes extreme for 30s on the same event?
  >Low 60s
   >Medium 30s
   >High 30s
   >Extreme 30s
[02/09/2024, 13:47:14] Ian: Assuming HAV goes from low 10 seconds Medium 10 seconds High 10 seconds Extreme 10 seconds the event would be
>Low 40s
>Medium 30s
>High 20s
>Extreme 10s
     */
  });

  // this can then be used to create these events
  return fixedHavs;
}

const getPreviousIMULevel = (imuLevel: ImuLevel): ImuLevel => {
  switch (imuLevel) {
    case "low":
      return "low";
    case "medium":
      return "low";
    case "high":
      return "medium";
    case "extreme":
      return "high";
  }
};
