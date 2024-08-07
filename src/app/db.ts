import { Beacon, Wearable } from "@prisma/client";
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
      console.error("Wearable not found");
      return;
    }

    return wearable;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const getBeacon = async (displayId: string): Promise<Beacon> => {
  try {
    console.log("Getting beacon with displayId:", displayId);

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

export const insertEvent = async (
  usableEvent: UsableEvent,
  wearable: Wearable,
  beacon?: undefined | Beacon,
) => {
  try {
    console.log("Adding event");

    if (usableEvent.isBeacon && beacon) {
      const eventType = beacon.type;

      await prisma.event.create({
        data: {
          timestamp: usableEvent.eventDate,
          eventType: eventType,
          deviceId: wearable.id,
          beaconId: beacon.id,
          organizationId: wearable.organizationId,
          userId: wearable.userId,
          duration: usableEvent.duration,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    } else {
      await prisma.event.create({
        data: {
          timestamp: usableEvent.eventDate,
          eventType: usableEvent.eventType,
          deviceId: wearable.id,
          userId: wearable.userId,
          organizationId: wearable.organizationId,
          duration: usableEvent.duration,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }
  } catch (error) {
    console.error(
      "ERROR: Inserting event",
      usableEvent?.displayId,
      wearable.id,
      beacon?.id,
    );
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

export const wearableUpdated = async (id: string) => {
  const date = new Date();

  await prisma.wearable.update({
    where: {
      id,
    },
    data: {
      updatedAt: date,
    },
  });
};

export const beaconUpdated = async (id: string) => {
  const date = new Date();

  await prisma.beacon.update({
    where: {
      id,
    },
    data: {
      updatedAt: date,
    },
  });
};
