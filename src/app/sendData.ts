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
import { SendSettings } from "../models/models";
import { groupHAVs } from "./groupHAVs";

interface BeaconTypeToWeableId {
  [key: string]: string[];
}

export const sendData = async (
  settings: SendSettings,
): Promise<WearableSettings> => {
  // console.log("first request:", settings.first_request, settings.device_id);

  let wearableSettings: WearableSettings;
  // 0. For testing data quickly
  // return fakeWearableSettings(settings.device_id || "123");

  // 1. We fetch the wearable from its display id
  const wearable = await getWearable(settings.device_id);

  // 2. We fetch the organisation from the org id from the wearable
  const org = await getOrganizationById(wearable.organizationId);

  // Note: Wearables override the org settings.

  if (!wearable || !org) {
    return dummySettings(settings.device_id);
  }

  // Group the HAVs and remove duplicates
  if (settings?.first_request === 1) {
    await groupHAVs(settings.device_id);
  }

  // 3. a) We need to create a list of beacon types to the exempt wearables.
  let beaconTypeToWearableIds: BeaconTypeToWeableId = {};

  org.beaconTypes.map((beaconType) => {
    const displayIds = beaconType.allowList.map(
      (wearable) => wearable.displayId,
    ); // This isn't wqorking because sometimes the wearable is not connected to a specifcic user, that means we are sending NULL but actually we want send like TRUE or match the DISPLAY ID

    beaconTypeToWearableIds = {
      ...beaconTypeToWearableIds,
      [beaconType.descriptor]: displayIds,
    };
  });

  // For testing the data quickly
  // Object.keys(beaconTypeToWearableIds).map((key) => {
  //   console.log(key, beaconTypeToWearableIds[key]);
  // });

  // 3. b) We use the beaconTypes and their allow lists to look for exemptions and make changes
  let wearableExempt = isWearableExemptFromTypes(
    wearable,
    beaconTypeToWearableIds,
  );

  // ALEX MAKE SURE TO DELETE AT END OF TRIAL
  const SRCGroup = ["0181", "0198"];
  const isSrcGroup = SRCGroup.includes(wearable.displayId);
  const enabledForSRC = isSrcGroup ? 1 : 0;

  const cockwells = [
    "0156",
    "0162",
    "0173",
    "0175",
    "0208",
    "0796",
    "0809",
    "0810",
  ];
  const enableCockwells = cockwells.includes(wearable.displayId) ? 1 : 0;

  const testing = ["0135", "0136"];
  const enableAlertsForTesting = testing.includes(wearable.displayId) ? 1 : 0;

  // 4. Map the distances to the org ones with ternary checks for exemptions
  wearableSettings = {
    device_id: settings.device_id,
    sensor_haptic_low: {
      enable: 1,
      icon_display: enableAlertsForTesting,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 30,
    },
    sensor_haptic_medium: {
      enable: 1,
      icon_display: enableAlertsForTesting,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 50,
    },
    sensor_haptic_high: {
      enable: 1,
      icon_display: enableAlertsForTesting,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 100,
    },
    sensor_haptic_extreme: {
      enable: 1,
      icon_display: enableAlertsForTesting,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 150,
    },
    sensor_MIC: {
      enable: 1,
      icon_display: enableCockwells || enabledForSRC,
      vibration_alert: enableCockwells || enabledForSRC,
      sound_alert: enableCockwells || enabledForSRC,
      trigger_condition: 80,
    },
    sensor_PPE1: {
      enable: wearableExempt.SmallPPE ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.ppeZoneSmall || 1,
    },
    sensor_PPE2: {
      enable: wearableExempt.MediumPPE ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.ppeZoneMedium || 3,
    },
    sensor_PPE3: {
      enable: wearableExempt.LargePPE ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.ppeZoneLarge || 6,
    },
    sensor_access1: {
      enable: wearableExempt.SmallUnauthorised ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.unauthorisedZoneSmall || 1,
    },
    sensor_access2: {
      enable: wearableExempt.MediumUnauthorised ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.unauthorisedZoneMedium || 3,
    },
    sensor_access3: {
      enable: wearableExempt.LargeUnauthorised ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.unauthorisedZoneLarge || 6,
    },
    sensor_forklift1: {
      enable: wearableExempt.SmallMachine ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.machineSmall || 1,
    },
    sensor_forklift2: {
      enable: wearableExempt.MediumMachine ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.machineMedium || 3,
    },
    sensor_forklift3: {
      enable: wearableExempt.LargeMachine ? 0 : 1,
      icon_display: 1,
      vibration_alert: enabledForSRC,
      sound_alert: enabledForSRC,
      trigger_condition: org.machineLarge || 6,
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

  sensor_haptic_low: SensorConfig;
  sensor_haptic_medium: SensorConfig;
  sensor_haptic_high: SensorConfig;
  sensor_haptic_extreme: SensorConfig;

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
    exemptions[key] = typesToWearableIds[key].includes(wearable.displayId);
  }

  return exemptions;
}

const dummySettings = (device_id: string): WearableSettings => {
  return {
    device_id,
    sensor_haptic_low: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 30,
    },
    sensor_haptic_medium: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 50,
    },
    sensor_haptic_high: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 100,
    },
    sensor_haptic_extreme: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 150,
    },

    sensor_MIC: {
      enable: 0,
      icon_display: 0,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 80,
    },
    sensor_PPE1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_PPE2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_PPE3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 6,
    },
    sensor_access1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_access2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_access3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 6,
    },
    sensor_forklift1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_forklift2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_forklift3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 6,
    },
  };
};
