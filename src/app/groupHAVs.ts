import {
  addHavEvents,
  deleteHavEvents,
  getHavEventsByWearableId,
  getOrganizationById,
  getWearable,
  translateImuSchemaToModel,
} from "./db";
import { HavStub, processHavs } from "../utils/havs";

export const groupHAVs = async (device_id: string) => {
  try {
    // console.log(`Manually creating a first request for: ${device_id}`);

    // 1. We fetch the wearable from its display id
    const wearable = await getWearable(device_id);

    // 2. We fetch the organisation from the org id
    const org = await getOrganizationById(wearable.organizationId);

    // 2. Fetch the HAV Events
    const havs = await getHavEventsByWearableId(org.id, wearable.id);
    // console.log("count of havs:", havs.length);

    const formattedHavs: HavStub[] = havs.map((hav) => ({
      imu_level: translateImuSchemaToModel(hav.imuLevel),
      timestamp: hav.timestamp,
      duration: hav.duration,
      userId: hav.userId,
    }));

    if (havs.length === 0) {
      console.log(
        "No HAV events processed [org, wearable]:",
        org.id,
        wearable.id,
      );
    } else {
      // console.log("org fetched:", org.id);
      // console.log("wearable fetched:", wearable.id);

      // console.log(`HAV Events fetched: ${havs.length}`);
      // havs.map((hav) =>
      //   console.log(`${hav.id}: ${hav.duration} - ${hav.imuLevel}`),
      // );

      // 3. Process the HAV Events
      const processedHavEvents = await processHavs(formattedHavs);

      // console.log(`Processed Events fetched: ${processedHavEvents.length}`);
      // processedHavEvents.map((hav) =>
      //   console.log(`${hav.duration} - ${hav.imu_level}`),
      // );

      // 4. Update the HAV events into Events
      await addHavEvents({
        organisationId: org.id,
        deviceId: wearable.id,
        havEvents: processedHavEvents,
      });

      // 5. Delete all HAV Events for that wearable
      await deleteHavEvents(org.id, wearable.id);
    }
  } catch (error) {
    console.error("Error in first request", error);
  }
};
