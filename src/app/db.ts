import dayjs from "dayjs";

import { Beacon, EventType, HAVEvent, Wearable } from "@prisma/client";
import prisma from "../../prisma/db";
import { UsableEvent } from "./receiveData";
import { HavStub, ImuLevel } from "../utils/havs";

export const getWearable = async (displayId: string) => {
  try {
    const wearable = await prisma.wearable.findUnique({
      where: {
        displayId,
      },
    });

    if (!wearable) {
      // console.error(`Wearable not found: ${displayId}`);
      return;
    }

    return wearable;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getBeacon = async (displayId: string): Promise<Beacon> => {
  if (!displayId) return;

  try {
    const beacon = await prisma.beacon.findFirst({
      where: {
        displayId: displayId,
      },
    });

    if (!beacon) {
      console.error("Beacon not found");
      return;
    }

    return beacon;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

// Event insertion helpers
type DuplicateCheckParams = {
  timestamp: Date;
  deviceId: string;
  eventType: EventType;
  duration: number;
};

const checkForDuplicate = async ({
  timestamp,
  deviceId,
  eventType,
  duration,
}: DuplicateCheckParams) => {
  if (eventType === "HandArmVibration") {
    const existingEvent = await prisma.hAVEvent.findFirst({
      where: { timestamp, deviceId, duration },
    });
    return !!existingEvent;
  }

  const existingEvent = await prisma.event.findFirst({
    where: { timestamp, deviceId, eventType, duration },
  });
  return !!existingEvent;
};

type HAVEventParams = {
  eventDate: Date;
  wearable: Wearable;
  duration: number;
  imuLevel: string;
};

const insertHAVEvent = async ({
  eventDate,
  wearable,
  duration,
  imuLevel,
}: HAVEventParams) => {
  if (duration <= 10) return null;

  return await prisma.hAVEvent.create({
    data: {
      timestamp: eventDate,
      deviceId: wearable.id,
      organizationId: wearable.organizationId,
      userId: wearable.userId || null,
      imuLevel: translateImuLeveltoDBSchema(imuLevel),
      duration,
      createdAt: new Date(),
      updatedAt: new Date(),
      status: "pending",
    },
  });
};

type BeaconEventParams = {
  eventDate: Date;
  wearable: Wearable;
  beacon: Beacon;
  duration: number;
};

const insertBeaconEvent = async ({
  eventDate,
  wearable,
  beacon,
  duration,
}: BeaconEventParams) => {
  return await prisma.event.create({
    data: {
      timestamp: eventDate,
      eventType: beacon.type,
      deviceId: wearable.id,
      beaconId: beacon.id,
      organizationId: wearable.organizationId,
      userId: wearable.userId,
      duration,
      severity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
};

type LoudNoiseEventParams = {
  eventDate: Date;
  wearable: Wearable;
  eventType: EventType;
  duration: number;
};

const insertLoudNoiseEvent = async ({
  eventDate,
  wearable,
  eventType,
  duration,
}: LoudNoiseEventParams) => {
  return await prisma.event.create({
    data: {
      timestamp: eventDate,
      eventType: "LoudNoise",
      deviceId: wearable.id,
      userId: wearable.userId,
      organizationId: wearable.organizationId,
      duration,
      severity: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
};

export const insertEvent = async (
  usableEvent: UsableEvent,
  wearable: Wearable,
  beacon?: undefined | Beacon,
) => {
  if (usableEvent.eventType !== "HandArmVibration") {
    console.log(
      "Adding event:",
      wearable.displayId,
      usableEvent.duration,
      dayjs(usableEvent.eventDate).format("YYYY-MM-DD HH:mm:ss"),
      usableEvent.eventType,
    );
  }

  try {
    const isDuplicate = await checkForDuplicate({
      timestamp: usableEvent.eventDate,
      deviceId: wearable.id,
      eventType: usableEvent.eventType,
      duration: usableEvent.duration,
    });

    if (isDuplicate) return null;

    if (usableEvent.eventType === "HandArmVibration") {
      return await insertHAVEvent({
        eventDate: usableEvent.eventDate,
        wearable,
        duration: usableEvent.duration,
        imuLevel: usableEvent.imuLevel,
      });
    }

    if (usableEvent.isBeacon && beacon) {
      return await insertBeaconEvent({
        eventDate: usableEvent.eventDate,
        wearable,
        beacon,
        duration: usableEvent.duration,
      });
    }

    return await insertLoudNoiseEvent({
      eventDate: usableEvent.eventDate,
      wearable,
      eventType: usableEvent.eventType,
      duration: usableEvent.duration,
    });
  } catch (error) {
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

type SafeImuLevel = "Low" | "Medium" | "High" | "Extreme";

const translateImuLeveltoDBSchema = (imuLevel: string): SafeImuLevel => {
  switch (imuLevel) {
    case "low":
      return "Low";
    case "medium":
      return "Medium";
    case "high":
      return "High";
    case "extreme":
      return "Extreme";
    default:
      return "Low";
  }
};

export const translateImuSchemaToModel = (imuLevel: SafeImuLevel): ImuLevel => {
  switch (imuLevel) {
    case "Low":
      return "low";
    case "Medium":
      return "medium";
    case "High":
      return "high";
    case "Extreme":
      return "extreme";
    default:
      return "low";
  }
};

export async function getOrganizationById(organizationId: string) {
  try {
    // Fetch the organization from the database
    const organization = await prisma.organization.findUnique({
      where: {
        id: organizationId,
      },
      include: {
        beaconTypes: {
          include: {
            allowList: true, // Include the allowList of Wearables for each BeaconType
          },
        },
      },
    });

    if (!organization) {
      throw new Error(`Organization with ID ${organizationId} not found`);
    }

    return organization;
  } catch (error) {
    console.error("Error fetching organization:", error);
    return;
  } finally {
    // Disconnect the Prisma Client
    await prisma.$disconnect();
  }
}

export const wearableUpdated = async (id: string, version?: string) => {
  const date = new Date();

  await prisma.wearable.update({
    where: {
      id,
    },
    data: {
      updatedAt: date,
      version,
    },
  });
};

export const chargerUpdated = async (id: string, version?: string) => {
  const date = new Date();

  await prisma.chargingStation.update({
    where: { id },
    data: {
      updatedAt: date,
      version,
    },
  });
};

export const updateBeacon = async (id: string, battery: number) => {
  const date = new Date();

  if (battery === 0) {
    await prisma.beacon.update({
      where: {
        id,
      },
      data: {
        updatedAt: date,
      },
    });
    return;
  }

  await prisma.beacon.update({
    where: {
      id,
    },
    data: {
      updatedAt: date,
      battery,
    },
  });
};

export const getHavEventsByWearableId = async (
  organizationId: string,
  deviceId: string,
) => {
  try {
    const havEvents = await prisma.hAVEvent.findMany({
      where: {
        organizationId,
        deviceId,
        status: "pending",
      },
    });

    return havEvents;
  } catch (error) {
    console.error("Error fetching HAV events:", error);
    return;
  } finally {
    await prisma.$disconnect();
  }
};

export const addHavEvents = async ({
  organisationId,
  deviceId,
  havEvents,
}: {
  organisationId: string;
  deviceId: string;
  havEvents: HavStub[];
}) => {
  try {
    const data = havEvents.map((hav) => {
      return {
        timestamp: hav.timestamp,
        eventType: "HandArmVibration" as EventType,
        deviceId: deviceId,
        organizationId: organisationId,
        userId: hav.userId,
        duration: hav.duration,
        severity: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        imuLevel: translateImuLeveltoDBSchema(hav.imu_level),
      };
    });

    data.map((hav) =>
      console.log(
        `Adding HAV event: ${dayjs(hav.timestamp).format(
          "YYYY-MM-DD HH:mm:ss",
        )} - ${hav.duration} - ${hav.imuLevel} - ${hav.deviceId}`,
      ),
    );

    await prisma.event.createMany({
      data,
    });
  } catch (error) {
    console.error("Error in addHavEvents:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

export const deleteHavEvents = async (
  organizationId: string,
  wearableId: string,
) => {
  try {
    // Get all pending HAV events
    const pendingEvents = await prisma.hAVEvent.findMany({
      where: {
        organizationId,
        deviceId: wearableId,
        status: "pending",
      },
      select: { id: true },
    });

    const batchSize = 50;
    const results = {
      totalProcessed: 0,
      successCount: 0,
      failedBatches: 0,
    };

    // Process in batches of 50
    for (let i = 0; i < pendingEvents.length; i += batchSize) {
      const batch = pendingEvents.slice(i, i + batchSize);
      const ids = batch.map((event) => event.id);

      try {
        await prisma.hAVEvent.updateMany({
          where: {
            id: { in: ids },
          },
          data: {
            status: "done",
            updatedAt: new Date(),
          },
        });
        results.successCount += batch.length;
      } catch (error) {
        console.error(`Error updating batch ${i / batchSize + 1}:`, error);
        results.failedBatches++;
      }
      results.totalProcessed += batch.length;
    }

    // console.log(`Processed ${results.totalProcessed} HAV events:`, {
    //   successful: results.successCount,
    //   failedBatches: results.failedBatches,
    // });

    return results;
  } catch (error) {
    console.error("Error in deleteHavEvents:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

export const getChargingStation = async (id: string) => {
  const chargingStation = prisma.chargingStation.findFirst({
    where: {
      displayId: id,
    },
  });
  return chargingStation;
};

export const addWearable = async ({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) => {
  const wearable = await prisma.wearable.create({
    data: {
      displayId: id,
      organizationId,

      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });

  return wearable;
};

export const updateWearableOrgById = async ({
  id,
  organizationId,
}: {
  id: string;
  organizationId: string;
}) => {
  await prisma.wearable.update({
    where: {
      id: id,
    },
    data: {
      organizationId: organizationId,
      updatedAt: new Date(),
    },
  });
};
