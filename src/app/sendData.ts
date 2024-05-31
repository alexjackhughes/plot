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

We should create a function that just returns enabled for everything

And then another function that fetches:
1. The distances for this organisation, which I guess we get from the device_id to org_id to org
2. We have the wearable_id
*/

import { SendSettings } from "./models";

export const sendData = async (settings: SendSettings) => {
  return fakeWearableSettings(settings.device_id || "123");
};

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

export const fakeWearableSettings = (id: string): WearableSettings => {
  return {
    device_id: id,
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
      trigger_condition: 3,
    },
    sensor_PPE2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 5,
    },
    sensor_PPE3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 10,
    },
    sensor_access1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_access2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 5,
    },
    sensor_access3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 10,
    },
    sensor_forklift1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_forklift2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 5,
    },
    sensor_forklift3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 10,
    },
  };
};
