/*
This file is responsible for sending settings for this wearable, fetching data from the database.

{
    "device_id": <string>,
    "sensor_haptic": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_MIC": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_PPE1": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_PPE2": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
        "sound_alert": <int>,
        "trigger_condition": <int>
    },
    "sensor_PPE3": {
        "enable": <int>,
        "icon_display": <int>,
        "vibration_alert": <int>,
"sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_access1": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_access2": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_access3": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_forklift1": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_forklift2": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
},
"sensor_forklift3": {
    "enable": <int>,
    "icon_display": <int>,
    "vibration_alert": <int>,
    "sound_alert": <int>,
    "trigger_condition": <int>
}

We should create a function that just returns enabled for everything

And then another function that fetches:
1. The distances for this organisation, which I guess we get from the device_id to org_id to org
2. We have the wearable_id
*/

import { SendSettings } from "./models";

export const sendData = async (settings: SendSettings) => {};
