/*

1. We handle this

 0 = send data
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
● 1 = Haptic
● 2 = Beacon
● 3 = Noise

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

2.a. We then sort out this into our own data format
2.b. We store it in the database
2.c. We send an ACK back to the device

3. We send this data on type 1 requests

{
    "device_id": <string>,
    "sensor_haptic": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_MIC": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_PPE1": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_PPE2": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_PPE3": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
"sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_access1": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_access2": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_access3": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_forklift1": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_forklift2": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_forklift3": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
}

We should create a function that just returns enabled for everything

And then another function that fetches:
1. The distances for this organisation, which I guess we get from the device_id to org_id to org
2. We have the wearable_id
*/

export interface WearableEventTime {
  hour: number;
  minute: number;
  second: number;
}

export interface WearableEvent {
  event_time: WearableEventTime;
  event_type: number;
  device_id: string;
  beacon_minor: string;
  duration: number;
  request_type: number;
}

export const getDateWithEventTime = (eventTime: WearableEventTime): Date => {
  const today = new Date();
  today.setHours(eventTime.hour);
  today.setMinutes(eventTime.minute);
  today.setSeconds(eventTime.second);
  today.setMilliseconds(0); // Ensure no leftover milliseconds
  return today;
};

type WearableEventType = "haptic" | "beacon" | "noise";

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

const getProximityDetails = (beaconId: string): ProximityDetails => {
  const eventTypeNumber = parseInt(beaconId.charAt(0), 10);
  let eventTypeStr: ProximityType;
  let size: Size;

  switch (eventTypeNumber) {
    case 1:
      eventTypeStr = "PreventativeProtectiveEquipment";
      size = "small";
      break;
    case 2:
      eventTypeStr = "PreventativeProtectiveEquipment";
      size = "medium";
      break;
    case 3:
      eventTypeStr = "PreventativeProtectiveEquipment";
      size = "large";
      break;
    case 4:
      eventTypeStr = "UnauthorisedAccess";
      size = "small";
      break;
    case 5:
      eventTypeStr = "UnauthorisedAccess";
      size = "medium";
      break;
    case 6:
      eventTypeStr = "UnauthorisedAccess";
      size = "large";
      break;
    case 7:
      eventTypeStr = "MovingMachinery";
      size = "small";
      break;
    case 8:
      eventTypeStr = "MovingMachinery";
      size = "medium";
      break;
    case 9:
      eventTypeStr = "MovingMachinery";
      size = "large";
      break;
    default:
      eventTypeStr = "MovingMachinery";
      size = "small";
  }

  return {
    eventType: eventTypeStr,
    size: size,
  };
};

function convertMillisecondsToSeconds(milliseconds: number): number {
  return Math.ceil(milliseconds / 1000);
}

interface UsableEvent {
  eventDate: Date;
  eventType: WearableEventType;
  displayId: string;
  beaconMinor: string | undefined;
  isBeacon: boolean;
  duration: number; // seconds rounded up
  proximityDetails: ProximityDetails;
}

const createUsableEvent = (input: WearableEvent): UsableEvent => {
  return {
    eventDate: getDateWithEventTime(input.event_time),
    eventType: getWearableEventType(input.event_type),
    displayId: input.device_id,
    beaconMinor: input.beacon_minor.length > 0 ? input.beacon_minor : undefined,
    isBeacon: input.beacon_minor.length > 0 ? true : false,
    duration: convertMillisecondsToSeconds(input.duration),
    proximityDetails: getProximityDetails(input.beacon_minor),
  };
};

export const handleEvent = (event: WearableEvent): void => {
  // Format the data in an easy to use way
  const usableEvent = createUsableEvent(event);

  // Insert the data into supabase
};

// TO-DO Alex:
// 1. I think we have all the utility functions we need to handle the data
// 2. we need to set-up the new supabase and explore the types
// 3. We basically need to redo the whole 'events' file so that it works with the new data format
// 4. We need a new file for handling the other type of request

// 5. Our beacon logic is wrong, there needs to be a new table for each organisation, which includes all nine types
// and an allow list for that organisation, and you use that to decide who has and hasn't got access

/**
 * We get a wearable ID
 * The watch is asking for a list of settings for this wearable, to block the nine types of beacons
 * So we need to get the wearable from the wearable ID
 * And the organisation from the wearable
 * Then we need to get the nine types of beacons from the organisation ID
 * Then we need to check this wearableId against the allow list for each of the nine types
 *
 * The beacons on the other side should have a type, which is one of the nine types (smallMachine etc)
 * Which links 1:1 with the nine types and the allowlist for the organisation
 *
 * We are then making edits to this list, rather than to the beacon itself
 * We are also using this type to fetch the users
 *
 */
