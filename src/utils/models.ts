export interface SendingData {
  event_time: {
    hour: number;
    minute: number;
    second: number;
  };
  event_type: number;
  device_id: string;
  beacon_id: string;
  duration: number; // in milliseconds
  request_type: 0;
}

const x: SendingData = {
  event_time: { hour: 0, minute: 0, second: 4 },
  event_type: 3,
  device_id: "008",
  beacon_id: "0",
  duration: 1426,
  request_type: 0,
};

export interface RecieveSettings {
  device_id: string;
  request_type: 1;
}

// Allowed ranges for beacon triggers:
// ● machine_trigger: 10-15m
// ● ppe_trigger: 2-3m
// ● access_trigger: 2 - 3m

export interface ServerMessage {
  device_id: string; // Using the same device_id from the client message
  haptic_trigger: number; // 2.5 m/s squared (dangerous limit), vibration levels - so in future, this will be different intensity threshold (range and time) for if there's an issue
  machine_trigger: number; // 60 - 120 decibels (dB) max limit

  ppe_trigger: number; // in meters
  access_trigger: number; // in meters
  noise_trigger: number; // in meters
}

export const getData = (data: any): SendingData | RecieveSettings => {
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
    beacon_id: data.beacon_id,
    duration: data.duration,
    request_type: 0,
  };
};

export function flattenData(data: SendingData | RecieveSettings): any {
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
