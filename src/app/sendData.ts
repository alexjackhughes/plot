import { Wearable } from "@prisma/client";
import { getOrganizationById, getWearable } from "./db";
import { SendSettings } from "../models/models";
import { groupHAVs } from "./groupHAVs";
import {
  getDeviceConfiguration,
  mapConfigurationToWearableSettings,
} from "../core/Configuration";

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
  // This is only done on the first request
  if (settings?.first_request === 1) {
    await groupHAVs(settings.device_id);
  }

  // From here we do the following:
  // Fetch the configuration from our file that goes wearable > org > fallback
  // Map the configuration on to our actual wearable settings i.e. numbers over booleans etc
  // Disable any beacon alerts for wearables that are exempt from certain beacon types
  // Provide the final response back to the API

  const configMap = await getDeviceConfiguration({
    // wearableId: wearable.id, // We don't do this yet as we don't allow the user to set wearable-specific settings
    organizationId: org.id,
  });

  // 3. a) We need to create a list of beacon types to the exempt wearables.
  let beaconTypeToWearableIds: BeaconTypeToWeableId = {};

  org.beaconTypes.map((beaconType) => {
    const displayIds = beaconType.allowList.map(
      (wearable) => wearable.displayId,
    );

    beaconTypeToWearableIds = {
      ...beaconTypeToWearableIds,
      [beaconType.descriptor]: displayIds,
    };
  });

  // We exempt wearables based on their beacon types
  // This might be easier to do by having the alerts disabled at the wearable level, now that we have that ability
  let wearableExempt = isWearableExemptFromTypes(
    wearable,
    beaconTypeToWearableIds,
  );

  const mappedSettings = mapConfigurationToWearableSettings({
    deviceId: settings.device_id,
    configMap,
    wearableExempt,
  });

  return mappedSettings;
};

export interface BeaconTypeMap {
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
      icon_display: 0,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 30,
    },
    sensor_haptic_medium: {
      enable: 1,
      icon_display: 0,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 50,
    },
    sensor_haptic_high: {
      enable: 1,
      icon_display: 0,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 100,
    },
    sensor_haptic_extreme: {
      enable: 1,
      icon_display: 0,
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
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 1,
    },
    sensor_PPE2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 3,
    },
    sensor_PPE3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 6,
    },
    sensor_access1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 1,
    },
    sensor_access2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 3,
    },
    sensor_access3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 6,
    },
    sensor_forklift1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 1,
    },
    sensor_forklift2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 3,
    },
    sensor_forklift3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: 6,
    },
  };
};
