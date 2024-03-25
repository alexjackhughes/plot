// We have the device_id, so '005' - there are going to be duplicates so need to delete the old ones
// We need to findFirst the "device_id" from 'clientspace_device_link_contact' table
// We need to use the previous id to findFirst the 'client_device_id' from 'user_device' table
// We then can use that ID to make the events in the following tables

import { createClient } from "@supabase/supabase-js";
import { SendingData } from "./models";
import { getBeaconType, mapBeaconIdToDatabaseId } from "./beacons";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Event Tables:
// 1 Haptic device_fact_hand_arm_vibration
// 2 UnauthorizedAccess device_fact_zone_permit
// 2 MachineCollision device_fact_machine_collision
// 2 PPE device_fact_ppe_check
// 3 Noise device_fact_noise

// We are going to use these names to find the ID of the org, then use that to find the right device ID, and then we can put it in directly to the SQL queries
// 005 and 002 to DHL Test
// 006 and 008 Stanton
// 009 and 010 Elite Precast

export const insertEvent = async (data: SendingData): Promise<void> => {
  switch (data.event_type) {
    case 1:
      return await insertHaptic(data);
    case 2:
      return await insertBeacon(data);
    case 3:
      await insertNoise(data);
      return;
  }
};

const insertNoise = async ({ device_id, duration }: SendingData) => {
  const { data, error } = await supabase.from("noise").insert([
    {
      wearable_device_id: deviceIdToWearableDeviceId(device_id), // We need to get this from the above
      event_date_time: new Date().toISOString(), // ISO 8601 format
      loud_noise_duration: duration / 1000,
      alert_dismissed: true,
      alert_accepted_date_time: new Date().toISOString(),
      rec_added_by_user_id: null,
      rec_added_on: new Date().toISOString(), // ISO 8601 format
      rec_updated_by_user_id: null,
      rec_updated_on: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.log("Error inserting noise event", error);
  }
};

const insertHaptic = async ({ device_id, duration }: SendingData) => {
  const { error } = await supabase.from("hand_arm_vibration").insert([
    {
      wearable_device_id: deviceIdToWearableDeviceId(device_id),
      event_date_time: new Date().toISOString(), // ISO 8601 format
      hav_duration: duration / 1000,
      alert_dismissed: false,
      alert_accepted_date_time: null,
      rec_added_by_user_id: "a40df00f-1d7b-4793-aa58-c70ef4063946",
      rec_added_on: new Date().toISOString(), // ISO 8601 format
      rec_updated_by_user_id: null,
      rec_updated_on: new Date().toISOString(),
    },
  ]);

  if (error) {
    console.log("Error inserting haptic event", error);
  }
};

const insertBeacon = async (data: SendingData) => {
  const beacon = getBeaconType(data.beacon_id);

  switch (beacon) {
    case "PPE":
      return await insertPPE(data);
    case "UnauthorizedAccess":
      return await insertUnauthorizedAccess(data);
    case "MachineCollision":
      return await insertMachineCollision(data);
  }
};

const insertPPE = async ({ beacon_id, device_id }: SendingData) => {
  const { data, error } = await supabase.from("ppe_check").insert([
    {
      wearable_device_id: deviceIdToWearableDeviceId(device_id),
      beacon_device_id: mapBeaconIdToDatabaseId(beacon_id),
      event_date_time: new Date().toISOString(), // ISO 8601 format
      alert_accepted: true,
      alert_accepted_date_time: new Date().toISOString(), // ISO 8601 format
      ppe_type: "Helmet",
      rec_added_by_user_id: null,
      rec_added_on: new Date().toISOString(), // ISO 8601 format
      rec_updated_by_user_id: null,
      rec_updated_on: new Date().toISOString(), // ISO 8601 format
    },
  ]);

  if (error) {
    console.log("Error inserting PPE event", error);
  }
};

const insertUnauthorizedAccess = async ({
  device_id,
  beacon_id,
  duration,
}: SendingData) => {
  const { data, error } = await supabase.from("zone_permit").insert([
    {
      wearable_device_id: deviceIdToWearableDeviceId(device_id),
      event_date_time: new Date().toISOString(), // ISO 8601 format
      beacon_device_id: mapBeaconIdToDatabaseId(beacon_id),
      alert_accepted: true,
      alert_accepted_date_time: new Date().toISOString(), // ISO 8601 format
      proximity_duration: duration / 1000,
      alert_acceptance_duration: 5,
      rec_added_by_user_id: null,
      rec_added_on: new Date().toISOString(), // ISO 8601 format
    },
  ]);

  if (error) {
    console.log("Error inserting unauthorized access event", error);
  }
};

const insertMachineCollision = async ({
  beacon_id,
  device_id,
  duration,
}: SendingData) => {
  const { data, error } = await supabase.from("machine_collision").insert([
    {
      wearable_device_id: deviceIdToWearableDeviceId(device_id),
      event_date_time: new Date().toISOString(), // ISO 8601 format
      beacon_device_id: mapBeaconIdToDatabaseId(beacon_id),
      alert_accepted: true,
      alert_accepted_date_time: new Date().toISOString(), // ISO 8601 format
      proximity_duration: duration / 1000,
      alert_acceptance_duration: 5,
      rec_added_by_user_id: "a40df00f-1d7b-4793-aa58-c70ef4063946",
      rec_added_on: new Date().toISOString(), // ISO 8601 format
      rec_updated_by_user_id: "a40df00f-1d7b-4793-aa58-c70ef4063946",
      rec_updated_on: new Date().toISOString(), // ISO 8601 format
    },
  ]);

  if (error) {
    console.log("Error inserting machine collision event", error);
  }
};

const deviceIdToWearableDeviceId = (device_id: string): string => {
  switch (device_id) {
    case "002":
      return "7";
    case "005":
      return "8";
    case "006":
      return "9";
    case "008": // this
      return "10";
    case "009": // this
      return "11";
    case "010":
      return "12";
    default:
      return "7";
  }
};
