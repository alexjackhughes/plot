type Proximity = "PPE" | "UnauthorizedAccess" | "MachineCollision";

// Define a type for the Beacons object where the key is a string and the value is of type Proximity
type BeaconsType = {
  [key: string]: Proximity;
};

// Alex, this is confusing because beacons actually have three IDs:
// There is the ID of that row in the database
// There is the ID that the beacon sends
// Then there is an ID on the sticker of the beacon
// So, what happens is the user adds the "sticker_id", which we then need to match to a "beacon_id", before
// finally attaching the event to a "database_id"

// In the future, the plan will be to have a "beacon_id_to_sticker_id" map, we can then use that ID to search
// for the database_id, using the sticker_id. This way, clients can add the beacons themselves, and we can
// still know the correct ones
export const Beacons: BeaconsType = {
  "1": "PPE", // 728 // 66
  "2": "PPE", // 729 // NONE
  "3": "PPE", // 730 // 59
  "4": "PPE", // 731 // 56
  "6": "UnauthorizedAccess", // 733 // NONE
  "7": "UnauthorizedAccess", // 734 // NONE
  "8": "UnauthorizedAccess", // 735 // 60
  "9": "UnauthorizedAccess", // 736 // 57
  "10": "UnauthorizedAccess", // 737 // 67
  "11": "MachineCollision", // 738 // NONE
  "12": "MachineCollision", // 739 // NONE
  "13": "MachineCollision", // 740 // 61
  "14": "MachineCollision", // 741 // 58
  "15": "MachineCollision", // 742 // 68
};

// This is wrong, because we are passing in the wrong beacon
export function getBeaconType(id: string): string | undefined {
  return Beacons[id];
}

// You get these IDs from here: clientspace_device_link_contact
export const mapBeaconIdToDatabaseId = (id: string): number => {
  switch (id) {
    case "1":
      return 66;
    case "3":
      return 59;
    case "4":
      return 56;
    case "8":
      return 60;
    case "9":
      return 57;
    case "10":
      return 67;
    case "13":
      return 61;
    case "14":
      return 58;
    case "15":
      return 68;
    default:
      return 53;
  }
};
