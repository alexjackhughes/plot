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

import { getWearable } from "./db";
import { WearableEvent, WearableEventTime } from "./models";

type WearableEventType = "haptic" | "beacon" | "noise";

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
      return "haptic";
    case 2:
      return "beacon";
    case 3:
    default:
      return "noise";
  }
};

type ProximityType =
  | "MovingMachinery"
  | "UnauthorisedAccess"
  | "PreventativeProtectiveEquipment";

type Size = "small" | "medium" | "large";

type ProximityDetails = {
  eventType: ProximityType;
  size: Size;
};

type BeaconDescriptor =
  | "SmallMachine"
  | "MediumMachine"
  | "LargeMachine"
  | "SmallPPE"
  | "MediumPPE"
  | "LargePPE"
  | "SmallUnauthorised"
  | "MediumUnauthorised"
  | "LargeUnauthorised";

const getBeaconDescriptor = (beaconId: string): BeaconDescriptor => {
  const beaconDescriptorId = parseInt(beaconId.charAt(0), 10);

  switch (beaconDescriptorId) {
    case 1:
      return "SmallPPE";
    case 2:
      return "MediumPPE";
    case 3:
      return "LargePPE";
    case 4:
      return "SmallUnauthorised";
    case 5:
      return "MediumUnauthorised";
    case 6:
      return "LargeUnauthorised";
    case 7:
      return "SmallMachine";
    case 8:
      return "MediumMachine";
    case 9:
    default:
      return "LargeMachine";
  }
};

function convertMillisecondsToSeconds(milliseconds: number): number {
  return Math.ceil(milliseconds / 1000);
}

interface UsableEvent {
  eventDate: Date;
  eventType: WearableEventType;
  displayId: string;
  beaconId: string | undefined;
  isBeacon: boolean;
  duration: number; // seconds and they are rounded up
  beaconDescriptor: BeaconDescriptor;
}

const createUsableEvent = (input: WearableEvent): UsableEvent => {
  return {
    eventDate: getDateWithEventTime(input.event_time),
    eventType: getWearableEventType(input.event_type),
    displayId: input.device_id,
    beaconId: input.beacon_minor.length > 0 ? input.beacon_minor : undefined,
    isBeacon: input.beacon_minor.length > 0 ? true : false,
    duration: convertMillisecondsToSeconds(input.duration),
    beaconDescriptor: getBeaconDescriptor(input.beacon_minor),
  };
};

export const receiveData = async (event: WearableEvent): Promise<void> => {
  // 1. Format the data in an easy to use way
  const usableEvent = createUsableEvent(event);

  // 2. Insert the data into supabase
  // a) We fetch the wearable from the display_id
  const wearable = await getWearable(usableEvent.displayId);

  if (!wearable) return console.error("Wearable not found");

  // b) If it's 1 or 2, we can just store the event with that info
  // c) If it's 3, we must also fetch the beacon from beacon_minor and store that info too
};
