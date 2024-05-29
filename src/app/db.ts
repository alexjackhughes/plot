import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const getWearable = async (id: string) => {};

export const getBeacon = async (id: string) => {};

export const addEvent = async (event: any) => {
  // An example insert
  // const { data, error } = await supabase.from("noise").insert([
  //   {
  //     wearable_device_id: deviceIdToWearableDeviceId(device_id), // We need to get this from the above
  //     event_date_time: new Date().toISOString(), // ISO 8601 format
  //     loud_noise_duration: convertToSeconds(duration),
  //     alert_dismissed: true,
  //     alert_accepted_date_time: new Date().toISOString(),
  //     rec_added_by_user_id: null,
  //     rec_added_on: new Date().toISOString(), // ISO 8601 format
  //     rec_updated_by_user_id: null,
  //     rec_updated_on: new Date().toISOString(),
  //   },
  // ]);
};
