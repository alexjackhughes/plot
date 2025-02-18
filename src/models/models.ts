export interface WearableEventTime {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export interface WearableEvent {
  request_type: 0;
  event_time: WearableEventTime;
  device_id: string;
  event_type: number; // Haptic = 1, Beacon = 2, Noise = 3
  imu_level: string; // “low”, "medium”, "high", or "extreme"
  beacon_minor: string;
  beacon_battery: number; // 1-100
  duration: number;
  charger_id: string;
  version: string;
}

export interface SendSettings {
  request_type: 1;
  device_id: string;
  version: string;
  first_request: 1 | 0; // 1 for first request, 0 for subsequent requests
  charger_id: string;
}

export interface VersionSettings {
  request_type: 2;
  charger_id: string;
  firmware_version: string;
}

export interface RequestTimezone {
  charger_id: string;
  request_timezone: string;
  request_type: 3;
}

export interface RequestFirmwareVersion {
  device_id: string;
  request_type: 4;
}

export interface RequestHAVGrouping {
  device_id: string;
  request_type: 5;
}
