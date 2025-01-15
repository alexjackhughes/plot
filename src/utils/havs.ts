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
  const fixedHavs = fixDurations(aggregatedHavs);

  // Only filter zero durations at the very end
  return fixedHavs.filter((hav) => hav.duration > 0);
}

export function groupHavsByDate(havs: HavStub[]): HavStub[][] {
  if (havs.length === 0) return [];

  havs.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

  const groupedHavs: HavStub[][] = [];
  let currentGroup: HavStub[] = [havs[0]];

  // Start from index 1 since we've already added the first HAV
  for (let i = 1; i < havs.length; i++) {
    const currentHav = havs[i];
    const previousHav = havs[i - 1];

    if (isWithinSameHour(currentHav.timestamp, previousHav.timestamp)) {
      currentGroup.push(currentHav);
    } else {
      groupedHavs.push([...currentGroup]);
      currentGroup = [currentHav];
    }
  }

  // Always add the last group since it contains at least one HAV
  groupedHavs.push(currentGroup);

  return groupedHavs;
}

export function isWithinSameHour(firstDate: Date, secondDate: Date): boolean {
  return dayjs(firstDate).isSame(secondDate, "hour");
}

export function aggregateHavsByIMU(havs: HavStub[][]): HavStub[][] {
  const imuLevels = ["low", "medium", "high", "extreme"] as ImuLevel[];

  return havs.map((group) => {
    // First, find the earliest timestamp and userId for this group
    const firstEvent = group.reduce((earliest, current) =>
      current.timestamp < earliest.timestamp ? current : earliest,
    );
    const groupStartTime = firstEvent.timestamp;
    const groupUserId = firstEvent.userId;

    return imuLevels.map((level) => {
      const filteredGroup = group.filter((hav) => hav.imu_level === level);

      if (filteredGroup.length === 0) {
        return {
          imu_level: level,
          timestamp: new Date(
            groupStartTime.getTime() + imuLevels.indexOf(level),
          ),
          duration: 0,
          userId: groupUserId,
        };
      }

      // Sort the filtered group by timestamp to ensure we get the true start
      filteredGroup.sort(
        (a, b) => a.timestamp.getTime() - b.timestamp.getTime(),
      );
      const firstEvent = filteredGroup[0];

      return {
        imu_level: level,
        timestamp: firstEvent.timestamp,
        duration: filteredGroup.reduce(
          (sum, current) => sum + current.duration,
          0,
        ),
        userId: firstEvent.userId,
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
    // Create a map of IMU level to its timestamp for this group
    const timestampMap = group.reduce(
      (map, hav) => {
        map[hav.imu_level] = hav.timestamp;
        return map;
      },
      {} as Record<ImuLevel, Date>,
    );

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

    // Get the earliest timestamp as fallback for levels without events
    const earliestTimestamp = group[0].timestamp;
    const userId = group[0].userId;

    // Apply the logic to adjust the times
    // Each level keeps its own duration minus any time that overlaps with higher levels
    const adjustedLowTime = Math.max(remainingLowTime - remainingMediumTime, 0);
    const adjustedMediumTime = Math.max(
      remainingMediumTime - remainingHighTime,
      0,
    );
    const adjustedHighTime = Math.max(
      remainingHighTime - remainingExtremeTime,
      0,
    );
    // Extreme keeps its full duration since it's the highest level
    const adjustedExtremeTime = remainingExtremeTime;

    // Create the adjusted HAV objects and push them into the result
    fixedHavs.push(
      {
        imu_level: "low",
        timestamp: timestampMap["low"] || earliestTimestamp,
        duration: adjustedLowTime,
        userId,
      },
      {
        imu_level: "medium",
        timestamp: timestampMap["medium"] || earliestTimestamp,
        duration: adjustedMediumTime,
        userId,
      },
      {
        imu_level: "high",
        timestamp: timestampMap["high"] || earliestTimestamp,
        duration: adjustedHighTime,
        userId,
      },
      {
        imu_level: "extreme",
        timestamp: timestampMap["extreme"] || earliestTimestamp,
        duration: adjustedExtremeTime,
        userId,
      },
    );
  });

  return fixedHavs;
}
