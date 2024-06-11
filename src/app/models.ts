export interface WearableEventTime {
  hour: number;
  minute: number;
  second: number;
}

export interface WearableEvent {
  "event-time": WearableEventTime;
  "event-type": number;
  "device-id": string;
  "beacon-minor": number;
  duration: number;
  "request-type": 0;
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
    "event-time": {
      hour: data.event_time.hour,
      minute: data.event_time.minute,
      second: data.event_time.second,
    },
    "event-type": data.event_type,
    "device-id": data.device_id,
    "beacon-minor": data.beacon_minor,
    duration: data.duration,
    "request-type": 0,
  };
};

export function flattenData(data: WearableEvent | SendSettings): any {
  // Check for the type of data based on request_type
  if (data["request-type"] === 0) {
    // Data is of SendingData type
    return {
      ...data["event-time"], // Spread the utc_time object to flatten it
      ...data, // Include the rest of the properties
    };
  } else {
    // Data is of RecieveSettings type, no need to flatten
    return data;
  }
}
