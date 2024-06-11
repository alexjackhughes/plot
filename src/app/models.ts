export interface WearableEventTime {
  hour: number;
  minute: number;
  second: number;
}

export interface WearableEvent {
  event_time: WearableEventTime;
  event_type: number;
  device_id: string;
  beacon_minor: string | number;
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
