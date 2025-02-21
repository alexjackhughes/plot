import { ConfigurationCategory, Configuration } from "@prisma/client";
import prisma from "../../prisma/db";
import { BeaconTypeMap, WearableSettings } from "~/app/sendData";

/**
 * Convert a boolean to 1 or 0
 */
const boolToNum = (value: boolean): number => value ? 1 : 0;

/**
 * Convert a boolean to 1 or 0, with an override condition
 * If override is true, returns 0 regardless of the value
 */
const boolToNumWithOverride = (override: boolean, value: boolean): number =>
  override ? 0 : boolToNum(value);

export interface ConfigurationSettings {
  category: ConfigurationCategory;
  enabled: boolean;
  icon_alert: boolean;
  vibration_alert: boolean;
  sound_alert: boolean;
  threshold: number;
}

export type ConfigurationMap = {
  [K in ConfigurationCategory]: ConfigurationSettings;
};

// You use this like:
// const config = await getDeviceConfiguration({ wearableId, organizationId });
// config.MACHINERY_SMALL.enabled = false;
// The rule of config goes: wearable > organization > fallback
export async function getDeviceConfiguration({
  wearableId,
  organizationId,
}: {
  wearableId?: string;
  organizationId: string;
}): Promise<ConfigurationMap> {
  // 1. Fetch wearable-level overrides only if wearableId is provided
  const wearableConfigs = wearableId
    ? await prisma.configuration.findMany({
        where: { wearableId },
      })
    : [];

  // 2. Fetch org defaults (where wearableId is null)
  const orgConfigs = await prisma.configuration.findMany({
    where: { organizationId, wearableId: null },
  });

  // 3. Merge them, falling back to a "hard-coded default" if neither exist
  const categories = Object.values(ConfigurationCategory);
  const merged = {} as Record<ConfigurationCategory, ConfigurationSettings>;

  categories.forEach((category) => {
    // Wearable override if present
    const wearableCfg = wearableConfigs.find((c) => c.category === category);
    if (wearableCfg) {
      merged[category] = wearableCfg;
      return;
    }

    // Otherwise org default
    const orgCfg = orgConfigs.find((c) => c.category === category);
    if (orgCfg) {
      merged[category] = orgCfg;
      return;
    }

    // Otherwise fallback to a built-in default
    merged[category] = getDefault(category);
  });

  return merged;
}

export function getDefault(
  category: ConfigurationCategory,
): ConfigurationSettings {
  // TO-DO: This needs to actually be the defaults we are expecting - alex
  switch (category) {
    // ~~~ HAV (Haptic) ~~~
    case ConfigurationCategory.HAV_LOW:
      return {
        category,
        enabled: true,
        icon_alert: false,
        vibration_alert: false,
        sound_alert: false,
        threshold: 30,
      };
    case ConfigurationCategory.HAV_MEDIUM:
      return {
        category,
        enabled: true,
        icon_alert: false,
        vibration_alert: false,
        sound_alert: false,
        threshold: 50,
      };
    case ConfigurationCategory.HAV_HIGH:
      return {
        category,
        enabled: true,
        icon_alert: false,
        vibration_alert: false,
        sound_alert: false,
        threshold: 100,
      };
    case ConfigurationCategory.HAV_EXTREME:
      return {
        category,
        enabled: true,
        icon_alert: false,
        vibration_alert: false,
        sound_alert: false,
        threshold: 150,
      };

    // ~~~ Noise (sensor_MIC) ~~~
    // For now, set all noise categories to the same threshold=80, which we will tweak in future.
    case ConfigurationCategory.NOISE_LOW:
    case ConfigurationCategory.NOISE_MEDIUM:
    case ConfigurationCategory.NOISE_HIGH:
    case ConfigurationCategory.NOISE_EXTREME:
      return {
        category,
        enabled: true,
        icon_alert: false,
        vibration_alert: false,
        sound_alert: false,
        threshold: 80,
      };

    // ~~~ PPE ~~~
    // Matches sensor_PPE1 => 1, PPE2 => 3, PPE3 => 6
    case ConfigurationCategory.PPE_SMALL:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 1,
      };
    case ConfigurationCategory.PPE_MEDIUM:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 3,
      };
    case ConfigurationCategory.PPE_LARGE:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 6,
      };

    // ~~~ Access ~~~
    // Matches sensor_access1 => 1, access2 => 3, access3 => 6
    case ConfigurationCategory.ACCESS_SMALL:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 1,
      };
    case ConfigurationCategory.ACCESS_MEDIUM:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 3,
      };
    case ConfigurationCategory.ACCESS_LARGE:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 6,
      };

    // ~~~ Machinery ~~~
    // Matches sensor_forklift1 => 1, forklift2 => 3, forklift3 => 6
    case ConfigurationCategory.MACHINERY_SMALL:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 1,
      };
    case ConfigurationCategory.MACHINERY_MEDIUM:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 3,
      };
    case ConfigurationCategory.MACHINERY_LARGE:
      return {
        category,
        enabled: true,
        icon_alert: true,
        vibration_alert: false,
        sound_alert: false,
        threshold: 6,
      };

    // If new enum values appear later, handle or fallback here:
    default:
      return {
        category,
        enabled: true,
        icon_alert: false,
        vibration_alert: false,
        sound_alert: false,
        threshold: 0,
      };
  }
}

/**
 * 1) Given an org ID, get all customizations for that org.
 */
export async function getOrgCustomizations(
  orgId: string,
): Promise<Configuration[]> {
  return prisma.configuration.findMany({
    where: { organizationId: orgId },
  });
}

/**
 * 2) Given a wearable ID, get all customizations for that wearable.
 */
export async function getWearableCustomizations(
  wearableId: string,
): Promise<Configuration[]> {
  return prisma.configuration.findMany({
    where: { wearableId },
  });
}

/**
 * 3) Given org ID, optional wearable ID, and a category, fetch the *relevant* row:
 *    - If wearableId is provided, return that wearable's row (if exists).
 *    - Otherwise return the org-level row for that category.
 */
export async function getConfigurationForCategory({
  orgId,
  category,
  wearableId,
}: {
  orgId: string;
  category: ConfigurationCategory;
  wearableId?: string;
}): Promise<Configuration | null> {
  // If wearableId is provided, look up that specific row
  if (wearableId) {
    const wearableConfig = await prisma.configuration.findFirst({
      where: {
        organizationId: orgId,
        wearableId,
        category,
      },
    });
    if (wearableConfig) return wearableConfig;
  }

  // Otherwise or if not found, fallback to org-level
  return prisma.configuration.findFirst({
    where: {
      organizationId: orgId,
      wearableId: null,
      category,
    },
  });
}

/**
 * 4) Upsert a configuration row:
 *    - If wearableId is present, attach to that wearable.
 *    - Otherwise attach to org-level (wearableId = null).
 *
 * Example usage:
 *    await upsertConfiguration({
 *      orgId: "org-123",
 *      wearableId: null,
 *      category: ConfigurationCategory.MACHINERY_SMALL,
 *      data: {
 *        enabled: false,
 *        threshold: 5,
 *        ...
 *      }
 *    });
 */
type PartialConfig = Pick<
  Configuration,
  "enabled" | "icon_alert" | "vibration_alert" | "sound_alert" | "threshold"
>;

export async function upsertConfiguration({
  orgId,
  wearableId,
  category,
  data,
}: {
  orgId: string;
  wearableId: string | null;
  category: ConfigurationCategory;
  data: PartialConfig;
}): Promise<Configuration> {
  const existing = await prisma.configuration.findFirst({
    where: {
      organizationId: orgId,
      wearableId,
      category,
    },
  });

  if (existing) {
    return prisma.configuration.update({
      where: { id: existing.id },
      data,
    });
  }

  return prisma.configuration.create({
    data: {
      organizationId: orgId,
      wearableId,
      category,
      ...data,
    },
  });
}

export const mapConfigurationToWearableSettings = ({
  deviceId,
  configMap,
  wearableExempt,
}: {
  deviceId: string;
  configMap: ConfigurationMap;
  wearableExempt: BeaconTypeMap;
}): WearableSettings => {
  return {
    device_id: deviceId,
    sensor_haptic_low: {
      enable: boolToNum(configMap["HAV_LOW"].enabled),
      icon_display: boolToNum(configMap["HAV_LOW"].icon_alert),
      vibration_alert: boolToNum(configMap["HAV_LOW"].vibration_alert),
      sound_alert: boolToNum(configMap["HAV_LOW"].sound_alert),
      trigger_condition: configMap["HAV_LOW"].threshold,
    },
    sensor_haptic_medium: {
      enable: boolToNum(configMap["HAV_MEDIUM"].enabled),
      icon_display: boolToNum(configMap["HAV_MEDIUM"].icon_alert),
      vibration_alert: boolToNum(configMap["HAV_MEDIUM"].vibration_alert),
      sound_alert: boolToNum(configMap["HAV_MEDIUM"].sound_alert),
      trigger_condition: configMap["HAV_MEDIUM"].threshold,
    },
    sensor_haptic_high: {
      enable: boolToNum(configMap["HAV_HIGH"].enabled),
      icon_display: boolToNum(configMap["HAV_HIGH"].icon_alert),
      vibration_alert: boolToNum(configMap["HAV_HIGH"].vibration_alert),
      sound_alert: boolToNum(configMap["HAV_HIGH"].sound_alert),
      trigger_condition: configMap["HAV_HIGH"].threshold,
    },
    sensor_haptic_extreme: {
      enable: boolToNum(configMap["HAV_EXTREME"].enabled),
      icon_display: boolToNum(configMap["HAV_EXTREME"].icon_alert),
      vibration_alert: boolToNum(configMap["HAV_EXTREME"].vibration_alert),
      sound_alert: boolToNum(configMap["HAV_EXTREME"].sound_alert),
      trigger_condition: configMap["HAV_EXTREME"].threshold,
    },
    sensor_MIC: {
      enable: boolToNum(configMap["NOISE_LOW"].enabled),
      icon_display: boolToNum(configMap["NOISE_LOW"].icon_alert),
      vibration_alert: boolToNum(configMap["NOISE_LOW"].vibration_alert),
      sound_alert: boolToNum(configMap["NOISE_LOW"].sound_alert),
      trigger_condition: configMap["NOISE_LOW"].threshold,
    },
    sensor_PPE1: {
      enable: boolToNumWithOverride(wearableExempt.SmallPPE, configMap["PPE_SMALL"].enabled),
      icon_display: boolToNum(configMap["PPE_SMALL"].icon_alert),
      vibration_alert: boolToNum(configMap["PPE_SMALL"].vibration_alert),
      sound_alert: boolToNum(configMap["PPE_SMALL"].sound_alert),
      trigger_condition: configMap["PPE_SMALL"].threshold,
    },
    sensor_PPE2: {
      enable: boolToNumWithOverride(wearableExempt.MediumPPE, configMap["PPE_MEDIUM"].enabled),
      icon_display: boolToNum(configMap["PPE_MEDIUM"].icon_alert),
      vibration_alert: boolToNum(configMap["PPE_MEDIUM"].vibration_alert),
      sound_alert: boolToNum(configMap["PPE_MEDIUM"].sound_alert),
      trigger_condition: configMap["PPE_MEDIUM"].threshold,
    },
    sensor_PPE3: {
      enable: boolToNumWithOverride(wearableExempt.LargePPE, configMap["PPE_LARGE"].enabled),
      icon_display: boolToNum(configMap["PPE_LARGE"].icon_alert),
      vibration_alert: boolToNum(configMap["PPE_LARGE"].vibration_alert),
      sound_alert: boolToNum(configMap["PPE_LARGE"].sound_alert),
      trigger_condition: configMap["PPE_LARGE"].threshold,
    },
    sensor_access1: {
      enable: boolToNumWithOverride(wearableExempt.SmallUnauthorised, configMap["ACCESS_SMALL"].enabled),
      icon_display: boolToNum(configMap["ACCESS_SMALL"].icon_alert),
      vibration_alert: boolToNum(configMap["ACCESS_SMALL"].vibration_alert),
      sound_alert: boolToNum(configMap["ACCESS_SMALL"].sound_alert),
      trigger_condition: configMap["ACCESS_SMALL"].threshold,
    },
    sensor_access2: {
      enable: boolToNumWithOverride(wearableExempt.MediumUnauthorised, configMap["ACCESS_MEDIUM"].enabled),
      icon_display: boolToNum(configMap["ACCESS_MEDIUM"].icon_alert),
      vibration_alert: boolToNum(configMap["ACCESS_MEDIUM"].vibration_alert),
      sound_alert: boolToNum(configMap["ACCESS_MEDIUM"].sound_alert),
      trigger_condition: configMap["ACCESS_MEDIUM"].threshold,
    },
    sensor_access3: {
      enable: boolToNumWithOverride(wearableExempt.LargeUnauthorised, configMap["ACCESS_LARGE"].enabled),
      icon_display: boolToNum(configMap["ACCESS_LARGE"].icon_alert),
      vibration_alert: boolToNum(configMap["ACCESS_LARGE"].vibration_alert),
      sound_alert: boolToNum(configMap["ACCESS_LARGE"].sound_alert),
      trigger_condition: configMap["ACCESS_LARGE"].threshold,
    },
    sensor_forklift1: {
      enable: boolToNumWithOverride(wearableExempt.SmallMachine, configMap["MACHINERY_SMALL"].enabled),
      icon_display: boolToNum(configMap["MACHINERY_SMALL"].icon_alert),
      vibration_alert: boolToNum(configMap["MACHINERY_SMALL"].vibration_alert),
      sound_alert: boolToNum(configMap["MACHINERY_SMALL"].sound_alert),
      trigger_condition: configMap["MACHINERY_SMALL"].threshold,
    },
    sensor_forklift2: {
      enable: boolToNumWithOverride(wearableExempt.MediumMachine, configMap["MACHINERY_MEDIUM"].enabled),
      icon_display: boolToNum(configMap["MACHINERY_MEDIUM"].icon_alert),
      vibration_alert: boolToNum(configMap["MACHINERY_MEDIUM"].vibration_alert),
      sound_alert: boolToNum(configMap["MACHINERY_MEDIUM"].sound_alert),
      trigger_condition: configMap["MACHINERY_MEDIUM"].threshold,
    },
    sensor_forklift3: {
      enable: boolToNumWithOverride(wearableExempt.LargeMachine, configMap["MACHINERY_LARGE"].enabled),
      icon_display: boolToNum(configMap["MACHINERY_LARGE"].icon_alert),
      vibration_alert: boolToNum(configMap["MACHINERY_LARGE"].vibration_alert),
      sound_alert: boolToNum(configMap["MACHINERY_LARGE"].sound_alert),
      trigger_condition: configMap["MACHINERY_LARGE"].threshold,
    },
  };
};
