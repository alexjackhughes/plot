import dayjs from "dayjs";

export type ImuLevel = "low" | "medium" | "high" | "extreme";

export interface HavStub {
  imu_level: ImuLevel;
  timestamp: Date;
  duration: number;
  userId: string | undefined;
}

export function processHavs(havs: HavStub[]): HavStub[] {
  const groupedHavs = groupHavsByDate(havs);
  const aggregatedHavs = aggregateHavsByIMU(groupedHavs);

  return fixDurations(aggregatedHavs).filter((hav) => hav.duration > 0);
}

export function groupHavsByDate(havs: HavStub[]): HavStub[][] {
  if (havs.length === 0) return [];

  havs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const groupedHavs: HavStub[][] = [];
  let currentGroup: HavStub[] = [];

  havs.forEach((currentHav, index) => {
    if (index === 0) {
      currentGroup.push(currentHav);
      return;
    }

    const previousHav = havs[index - 1];

    if (isWithinSameHour(currentHav.timestamp, previousHav.timestamp)) {
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
          timestamp: new Date(0), // Default to epoch time, could be customized
          duration: 0,
          userId: undefined,
        };
      }

      const earliestCreatedAt = filteredGroup.reduce((earliest, current) => {
        return current.timestamp < earliest.timestamp ? current : earliest;
      });

      const totalDuration = filteredGroup.reduce(
        (sum, current) => sum + current.duration,
        0,
      );

      return {
        imu_level: level,
        timestamp: earliestCreatedAt.timestamp,
        duration: totalDuration,
        userId: earliestCreatedAt.userId,
      };
    });
  });
}

/**
 * Takes a set group of HAVs and fixes the durations, so that the final result can be saved in the database.

Like let’s say someone was on extreme for 60 seconds, what events will I get?
> Low 60s
> Medium 60s
> High 60s
> Extreme 60s

So, we should return:
> Low 0s
> Medium 0s
> High 0s
> Extreme 60s

What about if it starts low for 30s and goes extreme for 30s on the same event?
> Low 60s
> Medium 30s
> High 30s
> Extreme 30s

So, we should return:
> Low 30s
> Medium 0s
> High 0s
> Extreme 10s

Assuming HAV goes from low 10 seconds, medium 10 seconds, high 10 seconds, extreme 10 seconds, the event would be:
> Low 40s
> Medium 30s
> High 20s
> Extreme 10s

So, we should return:
> Low 10s
> Medium 10s
> High 10s
> Extreme 10s

 */
export function fixDurations(havs: HavStub[][]): HavStub[] {
  const fixedHavs: HavStub[] = [];

  // Process each group of HAVs (each group is within the same time frame)
  havs.forEach((group) => {
    // Initialize variables for remaining time at each IMU level
    let remainingLowTime = 0;
    let remainingMediumTime = 0;
    let remainingHighTime = 0;
    let remainingExtremeTime = 0;

    // Iterate through the group and calculate remaining times
    group.forEach((hav) => {
      switch (hav.imu_level) {
        case "low":
          remainingLowTime += hav.duration;
          break;
        case "medium":
          remainingMediumTime += hav.duration;
          break;
        case "high":
          remainingHighTime += hav.duration;
          break;
        case "extreme":
          remainingExtremeTime += hav.duration;
          break;
      }
    });

    // Apply the logic to adjust the times
    // Extreme keeps its full duration, others adjust based on higher levels

    // High gets its own duration reduced by the extreme time
    const adjustedHighTime = Math.max(
      remainingHighTime - remainingExtremeTime,
      0,
    );
    // Medium gets reduced by both high and extreme time
    const adjustedMediumTime = Math.max(
      remainingMediumTime - remainingHighTime,
      0,
    );
    // Low gets reduced by medium, high, and extreme
    const adjustedLowTime = Math.max(remainingLowTime - remainingMediumTime, 0);

    // Create the adjusted HAV objects and push them into the result
    fixedHavs.push(
      {
        imu_level: "low",
        timestamp: group[0].timestamp,
        duration: adjustedLowTime,
        userId: group[0].userId,
      },
      {
        imu_level: "medium",
        timestamp: group[0].timestamp,
        duration: adjustedMediumTime,
        userId: group[0].userId,
      },
      {
        imu_level: "high",
        timestamp: group[0].timestamp,
        duration: adjustedHighTime,
        userId: group[0].userId,
      },
      {
        imu_level: "extreme",
        timestamp: group[0].timestamp,
        duration: remainingExtremeTime,
        userId: group[0].userId,
      },
    );
  });

  return fixedHavs;
}
