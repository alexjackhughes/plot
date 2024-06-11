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

import { getBeacon, getWearable, insertEvent } from "./db";
import { sendBigLog } from "./logging";
import { WearableEvent, WearableEventTime } from "./models";

type WearableEventType =
  | "HandArmVibration"
  | "MovingMachinery"
  | "LoudNoise"
  | "PreventativeProtectiveEquipment"
  | "UnauthorisedAccess";

const getDateWithEventTime = (eventTime: WearableEventTime): Date => {
  const today = new Date();
  today.setHours(eventTime.hour);
  today.setMinutes(eventTime.minute);
  today.setSeconds(eventTime.second);
  today.setMilliseconds(0); // Ensure no leftover milliseconds
  return today;
};

const getWearableEventType = (eventType: number): WearableEventType => {
  switch (eventType) {
    case 1:
      return "HandArmVibration";
    case 2:
      return "MovingMachinery"; // we need to get this from the beacon
    case 3:
    default:
      return "LoudNoise";
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
  beacon: ProximityDetails;
}

const createUsableEvent = (input: WearableEvent): UsableEvent => {
  return {
    eventDate: getDateWithEventTime(input.event_time),
    eventType: getWearableEventType(input.event_type),
    displayId: input.device_id,
    beaconId:
      input.beacon_minor !== 0 ? input.beacon_minor.toLocaleString() : null, // Beacon ID was 0 if it was not a beacon event
    isBeacon: input.beacon_minor !== 0 ? true : false,
    duration: convertMillisecondsToSeconds(input.duration),
    beacon: getProximityDetails(input.beacon_minor.toLocaleString()),
  };
};

export const receiveData = async (event: WearableEvent): Promise<void> => {
  // 1. Format the data in an easy to use way
  const usableEvent = createUsableEvent(event);

  // For railway log
  const message = usableEvent.toString();
  console.log("usable event:", message);

  let wearable = await getWearable(usableEvent.displayId);
  if (!wearable) return console.error("Wearable not found");

  // 2. If the event is a beacon event, get the beacon details
  if (usableEvent.isBeacon) {
    const beacon = await getBeacon(usableEvent.beaconId);

    wearable = {
      ...wearable,
      beaconId: beacon.id,
    };
  }

  // 3. Store the event in the database
  await insertEvent(usableEvent, wearable);
};
