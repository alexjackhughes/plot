import { getChargingStation } from "./db";

export const findChargerTimezone = async (
  chargerId: string,
): Promise<string> => {
  const charger = await getChargingStation(chargerId);

  // If the charger has a custom timezone set, we use that by default
  if (
    charger &&
    charger.timezone &&
    charger.timezone !== "" &&
    charger.timezone !== "GMT-0"
  ) {
    return charger.timezone;
  }

  // Get the current date
  const now = new Date();

  // Otherwise, we default to GMT-0 depending on daylight savings
  const isBST =
    now
      .toLocaleString("en-US", {
        timeZone: "Europe/London",
        timeZoneName: "short",
      })
      .split(" ")[2] === "BST";

  return isBST ? "GMT+1" : "GMT+0";
};
