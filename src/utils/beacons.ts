type Proximity = "PPE" | "UnauthorizedAccess" | "MachineCollision";

// Define a type for the Beacons object where the key is a string and the value is of type Proximity
type BeaconsType = {
  [key: string]: Proximity;
};

// Explicitly declare Beacons as BeaconsType
export const Beacons: BeaconsType = {
  "1": "PPE", // 728 // 53
  "2": "PPE", // 729 // NONE
  "3": "PPE", // 730 // 59
  "4": "PPE", // 731 // 56
  "6": "UnauthorizedAccess", // 733 // NONE
  "7": "UnauthorizedAccess", // 734 // NONE
  "8": "UnauthorizedAccess", // 735 // 60
  "9": "UnauthorizedAccess", // 736 // 57
  "10": "UnauthorizedAccess", // 737 // 54
  "11": "MachineCollision", // 738 // NONE
  "12": "MachineCollision", // 739 // NONE
  "13": "MachineCollision", // 740 // 61
  "14": "MachineCollision", // 741 // 58
  "15": "MachineCollision", // 742 // 55
};

// This is wrong, because we are passing in the wrong beacon
export function getBeaconType(id: string): string | undefined {
  return Beacons[id];
}

// You get these IDs from here: clientspace_device_link_contact
export const mapBeaconIdToDatabaseId = (id: string): number => {
  switch (id) {
    case "1":
      return 53;
    case "3":
      return 59;
    case "4":
      return 56;
    case "8":
      return 60;
    case "9":
      return 57;
    case "10":
      return 54;
    case "13":
      return 61;
    case "14":
      return 58;
    case "15":
      return 55;
    default:
      return 53;
  }
};
