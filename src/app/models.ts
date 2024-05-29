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
  request_type: 0;
}

export interface SendSettings {
  device_id: string;
  request_type: 1;
}

export const getData = (data: any): WearableEvent | SendSettings => {
  if (data.request_type === 1) {
    return {
      device_id: data.device_id,
      request_type: 1,
    };
  }

  return {
    event_time: {
      hour: data.event_time.hour,
      minute: data.event_time.minute,
      second: data.event_time.second,
    },
    event_type: data.event_type,
    device_id: data.device_id,
    beacon_minor: data.beacon_minor,
    duration: data.duration,
    request_type: 0,
  };
};

export function flattenData(data: WearableEvent | SendSettings): any {
  // Check for the type of data based on request_type
  if (data.request_type === 0) {
    // Data is of SendingData type
    const { event_time, ...rest } = data;
    return {
      ...event_time, // Spread the utc_time object to flatten it
      ...rest, // Include the rest of the properties
    };
  } else {
    // Data is of RecieveSettings type, no need to flatten
    return data;
  }
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

export const fakeWearableSettings = (id: string): WearableSettings => {
  return {
    device_id: id,
    sensor_haptic: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 2,
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
      trigger_condition: 2,
    },
    sensor_PPE3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_access1: {
      enable: 0,
      icon_display: 0,
      vibration_alert: 0,
      sound_alert: 0,
      trigger_condition: -1,
    },
    sensor_access2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_access3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 2,
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
      trigger_condition: 2,
    },
    sensor_forklift3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
  };
};
