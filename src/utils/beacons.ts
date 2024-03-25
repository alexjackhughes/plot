type Proximity = "PPE" | "UnauthorizedAccess" | "MachineCollision";

// Define a type for the Beacons object where the key is a string and the value is of type Proximity
type BeaconsType = {
  [key: string]: Proximity;
};


// ALEX HERE
// Explicitly declare Beacons as BeaconsType
export const Beacons: BeaconsType = {
  "1": "PPE", // 728
  "2": "PPE", // 729
  "3": "PPE", // 730
  "4": "PPE", // 731
  "6": "UnauthorizedAccess", // 733
  "7": "UnauthorizedAccess", // 734
  "8": "UnauthorizedAccess", // 735
  "9": "UnauthorizedAccess", // 736
  "10": "UnauthorizedAccess", // 737
  "11": "MachineCollision", // 738
  "12": "MachineCollision", // 739
  "13": "MachineCollision", // 740
  "14": "MachineCollision", // 741
  "15": "MachineCollision", // 742
};

// This is wrong, because we are passing in the wrong beacon
export function getBeaconType(id: string): string | undefined {
  return Beacons[id];
}

// todo: You get these IDs from here: clientspace_device_link_contact
export const mapBeaconIdToDatabaseId = (id: string): number => {
  switch (id) {
    case "730":
      return 59;
    case "735":
      return 60;
    case "740":
      return 59;
    case "731":
      return 56;
    case "736":
      return 57;
    case "741":
      return 58;
    case "728":
      return 53;
    case "737":
      return 54;
    case "742":
      return 55;
    // Should never return
    default:
      return 59;
  }
};
