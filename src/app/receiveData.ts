/*
This file is responsible for receiving events from the wearable devices and storing them in the database.

 0 = send data (this one!)
 1 = request settings

2. We receive the data in this format if it's a type 0 request:

 {
  "event_time": {
      "hour": <int>,
      "minute": <int>,
      "second": <int>
  },
  "event_type": <int>,
  "device_id": <string>,
  "beacon_minor": <string>,
  "duration": <int>,
  "request_type": <int>
}

Possible values for field event_type:
1: Haptic
2: Beacon
3: Noise

Beacon ID is in this format for the sizing:

PPE-1: 1
PPE-2: 2
PPE-3: 3
ACCESS-1: 4
ACCESS-2: 5
ACCESS-3: 6
forklift-1: 7
forklift-2: 8
forklift-3: 9

This is what an event looks like:
model Event {
  id             String    @id @default(dbgenerated("gen_random_uuid()"))
  timestamp      DateTime
  eventType      EventType
  deviceId       String?
  beaconId       String?
  userId         String?   @unique
  organizationId String
  createdAt      DateTime  @default(now())
  updatedAt      DateTime  @updatedAt
  duration       Int

  user         User?        @relation(fields: [userId], references: [id])
  organization Organization @relation(fields: [organizationId], references: [id])
  wearable     Wearable?    @relation(fields: [deviceId], references: [id])
  beacon       Beacon?      @relation(fields: [beaconId], references: [id])

  @@index([organizationId, timestamp], name: "idx_event_organization_timestamp")
  @@index([duration], name: "idx_event_duration")
  @@map("events")
}


a) We format this data received into our own data format
b) We store the formatted data as an event in the database
c) We send an ACK back to the device
*/

import { Beacon } from "@prisma/client";
import {
  updateBeacon,
  getBeacon,
  getWearable,
  insertEvent,
  wearableUpdated,
  getChargingStation,
  addWearable,
} from "./db";
import { WearableEvent, WearableEventTime } from "../models/models";

type WearableEventType =
  | "HandArmVibration"
  | "MovingMachinery"
  | "LoudNoise"
  | "PreventativeProtectiveEquipment"
  | "UnauthorisedAccess";

const getDateWithEventTime = (eventTime: WearableEventTime): Date => {
  const today = createDate(eventTime);

  today.setHours(eventTime.hour);
  today.setMinutes(eventTime.minute);
  today.setSeconds(eventTime.second);
  today.setMilliseconds(0); // Ensure no leftover milliseconds

  const currentDate = new Date();
  currentDate.setHours(eventTime.hour);
  currentDate.setMinutes(eventTime.minute);
  currentDate.setSeconds(eventTime.second);
  currentDate.setMilliseconds(0);

  // This prevents dates being in the distant past
  if (today.getFullYear() === currentDate.getFullYear()) {
    return today;
  } else {
    return currentDate;
  }
};

function createDate(eventTime: WearableEventTime): Date {
  const { year, month, day } = eventTime;

  if (year !== undefined && month !== undefined && day !== undefined) {
    return new Date(Date.UTC(year, month - 1, day));
  }

  return new Date();
}

const getWearableEventType = (
  eventType: number,
  beaconId: string,
): WearableEventType => {
  if (eventType === 1) return "HandArmVibration";
  if (eventType === 3) return "LoudNoise";

  if (!beaconId) return "PreventativeProtectiveEquipment";

  const firstLetter = beaconId.charAt(0);

  switch (firstLetter) {
    case "1":
    case "2":
    case "3":
      return "PreventativeProtectiveEquipment";
    case "4":
    case "5":
    case "6":
      return "UnauthorisedAccess";
    case "7":
    case "8":
    case "9":
    default:
      return "MovingMachinery";
  }
};

type ProximityType =
  | "MovingMachinery"
  | "UnauthorisedAccess"
  | "PreventativeProtectiveEquipment";

type Size = "small" | "medium" | "large";

type ProximityDetails = {
  type: ProximityType;
  size: Size;
};

const getProximityDetails = (beaconId: string): ProximityDetails => {
  if (!beaconId)
    return { type: "PreventativeProtectiveEquipment", size: "small" };

  const beaconDescriptorId = parseInt(beaconId.charAt(0), 10);

  switch (beaconDescriptorId) {
    case 1:
      return {
        type: "PreventativeProtectiveEquipment",
        size: "small",
      };
    case 2:
      return {
        type: "PreventativeProtectiveEquipment",
        size: "medium",
      };
    case 3:
      return {
        type: "PreventativeProtectiveEquipment",
        size: "large",
      };
    case 4:
      return { type: "UnauthorisedAccess", size: "small" };
    case 5:
      return { type: "UnauthorisedAccess", size: "medium" };
    case 6:
      return { type: "UnauthorisedAccess", size: "large" };
    case 7:
      return { type: "MovingMachinery", size: "small" };
    case 8:
      return { type: "MovingMachinery", size: "medium" };
    case 9:
    default:
      return { type: "MovingMachinery", size: "large" };
  }
};

function convertMillisecondsToSeconds(milliseconds: number): number {
  return Math.ceil(milliseconds / 1000);
}

export interface UsableEvent {
  eventDate: Date;
  eventType: WearableEventType;
  displayId: string;
  beaconId?: string | null;
  isBeacon: boolean;
  duration: number; // seconds and they are rounded up
  beacon?: ProximityDetails;

  // New things
  imuLevel?: ImuLevel;
  beaconBattery?: number;
  chargerId?: string;
}

type ImuLevel = "low" | "medium" | "high" | "extreme";

const createUsableEvent = (input: WearableEvent): UsableEvent => {
  return {
    eventDate: getDateWithEventTime(input.event_time),
    eventType: getWearableEventType(input.event_type, input.beacon_minor),
    displayId: input.device_id,
    beaconId:
      input.beacon_minor === "0" ? null : input.beacon_minor?.toLocaleString(),
    isBeacon: input.event_type === 2,
    duration: convertMillisecondsToSeconds(input.duration),
    beacon: input.beacon_minor
      ? getProximityDetails(input.beacon_minor.toLocaleString())
      : undefined,

    beaconBattery: input.beacon_battery || undefined,
    chargerId: input.charger_id || undefined,
    imuLevel: imuLevelSelector(input.imu_level),
  };
};

const imuLevelSelector = (imuLevel?: string): ImuLevel | undefined => {
  if (!imuLevel) return undefined;

  const fixed = imuLevel.toLowerCase().replace(/\s+/g, "");

  switch (fixed) {
    case "low":
      return "low";
    case "medium":
      return "medium";
    case "high":
      return "high";
    case "extreme":
      return "extreme";
    default:
      return "low";
  }
};

export const receiveData = async (event: WearableEvent): Promise<void> => {
  // console.log(
  //   `timestamp for: ${event.device_id}`,
  //   event.event_time.hour,
  //   event.event_time.minute,
  //   event.event_time.second,
  //   event.event_time.year,
  //   event.event_time.month,
  //   event.event_time.day,
  // );
  // 1. Format the data in an easy to use way
  const usableEvent = createUsableEvent(event);

  // console.log("After time modification:", usableEvent.eventDate.toString());

  // For railway log
  // const message = JSON.stringify(event, null, 2);
  // console.log("Usable Event received:", message);

  let wearable = await getWearable(usableEvent.displayId);

  // If wearable and charger ID here are different, re-assign the charger ID to the wearable

  if (!wearable) {
    if (!usableEvent.chargerId) return;
    const usableChargerId = usableEvent.chargerId.split(" ")[1];

    const charger = await getChargingStation(usableChargerId);

    if (!charger) {
      console.error("Wearable/charging station not found");
      return;
    }

    await addWearable({
      id: usableEvent.displayId,
      organizationId: charger.organizationId,
    });
  }

  await wearableUpdated(wearable.id);

  let beacon: Beacon = undefined;

  // 2. If the event is a beacon event, get the beacon details
  if (usableEvent.isBeacon) {
    beacon = await getBeacon(usableEvent.beaconId);

    if (!beacon) {
      console.error("Beacon not found");
      return;
    }

    await updateBeacon(beacon.id, beacon.battery || 100);
  }

  // 3. Store the event in the database
  await insertEvent(usableEvent, wearable, beacon);
};
