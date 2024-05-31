import { Wearable } from "@prisma/client";
import prisma from "../../prisma/db";
import { UsableEvent } from "./receiveData";

export const getWearable = async (displayId: string): Promise<any> => {
  try {
    const wearable = await prisma.wearable.findUnique({
      where: {
        displayId,
      },
    });

    if (!wearable) {
      throw new Error("Wearable not found");
    }

    return wearable;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getBeacon = async (displayId: string) => {
  try {
    const beacon = await prisma.beacon.findFirst({
      where: {
        displayId: displayId,
      },
    });

    if (!beacon) {
      throw new Error("Beacon not found");
    }

    return beacon;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
};

export const insertEvent = async (
  usableEvent: UsableEvent,
  wearable: Wearable,
) => {
  try {
    let eventType = usableEvent.isBeacon
      ? usableEvent.beacon.type
      : usableEvent.eventType;

    const event = await prisma.event.create({
      data: {
        timestamp: usableEvent.eventDate,
        eventType: eventType,
        deviceId: usableEvent.displayId,
        beaconId: usableEvent.beaconId || null,
        organizationId: wearable.organizationId,
        duration: usableEvent.duration,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    return event;
  } catch (error) {
    console.error(error);
    throw error;
  } finally {
    await prisma.$disconnect();
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
        beaconTypes: true,
      },
    });

    if (!organization) {
      throw new Error(`Organization with ID ${organizationId} not found`);
    }

    return organization;
  } catch (error) {
    console.error("Error fetching organization:", error);
    throw error;
  } finally {
    // Disconnect the Prisma Client
    await prisma.$disconnect();
  }
}
