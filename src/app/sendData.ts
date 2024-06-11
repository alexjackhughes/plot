/*
This file is responsible for sending settings for this wearable, fetching data from the database.

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

And then another function that fetches:
1. The distances for this organisation, which I guess we get from the device_id to org_id to org
2. We have the wearable_id
*/

import { Wearable } from "@prisma/client";
import { getOrganizationById, getWearable } from "./db";
import { SendSettings } from "./models";
import { sendBigLog } from "./logging";

interface BeaconTypeToWeableId {
  [key: string]: string[];
}

export const sendData = async (
  settings: SendSettings,
): Promise<WearableSettings> => {
  let wearableSettings: WearableSettings;
  // 0. For testing data quickly
  // return fakeWearableSettings(settings.device_id || "123");

  // For railway log
  console.log("Trying to send data");

  // 1. We fetch the wearable from its display id
  const wearable = await getWearable(settings.device_id);

  // 2. We fetch the organisation from the org id
  const org = await getOrganizationById(wearable.organizationId);

  // 3. a) We need to create a list of beacon types to the exempt wearables.
  let beaconTypeToWearableIds: BeaconTypeToWeableId = {};

  org.beaconTypes.map((beaconType) => {
    const userIds = beaconType.allowList.map((wearable) => wearable.userId);

    beaconTypeToWearableIds = {
      ...beaconTypeToWearableIds,
      [beaconType.descriptor]: userIds,
    };
  });

  // 3. b) We use the beaconTypes and their allow lists to look for exemptions and make changes
  let wearableExempt = isWearableExemptFromTypes(
    wearable,
    beaconTypeToWearableIds,
  );

  console.log("EVENT", wearableExempt);

  // 4. Map the distances to the org ones with ternary checks for exemptions
  wearableSettings = {
    device_id: settings.device_id,
    sensor_haptic: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 20,
    },
    sensor_MIC: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 99,
    },
    sensor_PPE1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.SmallPPE ? 0 : org.ppeZoneSmall,
    },
    sensor_PPE2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.MediumPPE ? 0 : org.ppeZoneMedium,
    },
    sensor_PPE3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.LargePPE ? 0 : org.ppeZoneLarge,
    },
    sensor_access1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.SmallUnauthorised
        ? 0
        : org.unauthorisedZoneSmall,
    },
    sensor_access2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.MediumUnauthorised
        ? 0
        : org.unauthorisedZoneMedium,
    },
    sensor_access3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.LargeUnauthorised
        ? 0
        : org.unauthorisedZoneLarge,
    },
    sensor_forklift1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.SmallMachine ? 0 : org.machineSmall,
    },
    sensor_forklift2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.MediumMachine ? 0 : org.machineMedium,
    },
    sensor_forklift3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: wearableExempt.LargeMachine ? 0 : org.machineLarge,
    },
  };

  return wearableSettings;
};

interface BeaconTypeMap {
  SmallMachine: boolean;
  MediumMachine: boolean;
  LargeMachine: boolean;

  SmallPPE: boolean;
  MediumPPE: boolean;
  LargePPE: boolean;

  SmallUnauthorised: boolean;
  MediumUnauthorised: boolean;
  LargeUnauthorised: boolean;
}

export interface WearableSettings {
  device_id: string;
  sensor_haptic: SensorConfig;
  sensor_MIC: SensorConfig;
  sensor_PPE1: SensorConfig;
  sensor_PPE2: SensorConfig;
  sensor_PPE3: SensorConfig;
  sensor_access1: SensorConfig;
  sensor_access2: SensorConfig;
  sensor_access3: SensorConfig;
  sensor_forklift1: SensorConfig;
  sensor_forklift2: SensorConfig;
  sensor_forklift3: SensorConfig;
}

interface SensorConfig {
  enable: number;
  icon_display: number;
  vibration_alert: number;
  sound_alert: number;
  trigger_condition: number;
}

function isWearableExemptFromTypes(
  wearable: Wearable,
  typesToWearableIds: BeaconTypeToWeableId,
): BeaconTypeMap {
  let exemptions: BeaconTypeMap = {
    SmallMachine: false,
    MediumMachine: false,
    LargeMachine: false,

    SmallPPE: false,
    MediumPPE: false,
    LargePPE: false,

    SmallUnauthorised: false,
    MediumUnauthorised: false,
    LargeUnauthorised: false,
  };

  for (const key in typesToWearableIds) {
    exemptions[key] = typesToWearableIds[key].includes(wearable.userId);
  }

  return exemptions;
}
