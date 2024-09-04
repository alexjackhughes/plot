import { SendSettings, VersionSettings, WearableEvent } from "../models/models";

export const getData = (
  data: any,
): WearableEvent | SendSettings | VersionSettings => {
  if (data.request_type === 2) {
    return {
      charger_id: data?.charger_id || "",
      firmware_version: data?.firmware_version || "",
      request_type: 2,
    };
  }

  if (data.request_type === 1) {
    return {
      device_id: data?.device_id,
      request_type: 1,
      version: data?.version || "2.4.0",
      first_request: data?.first_request || 0,
      charger_id: data?.charger_id || "",
    };
  }

  return {
    event_time: {
      hour: data?.event_time?.hour,
      minute: data?.event_time?.minute,
      second: data?.event_time?.second,
      day: data?.event_time?.day,
      month: data?.event_time?.month,
      year: data?.event_time?.year,
    },
    event_type: data?.event_type,
    device_id: data?.device_id,
    beacon_minor: data?.beacon_minor,
    duration: data?.duration,
    imu_level: data?.imu_level,
    charger_id: data?.charger_id || "",
    beacon_battery: data?.beacon_battery,
    request_type: 0,
  };
};

export function flattenData(
  data: WearableEvent | SendSettings | VersionSettings,
): any {
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
