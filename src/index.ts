import { heartbeat, keepAlive } from "./utils/keepalive.js";
import { close } from "./utils/message.js";
import { Socket, newState } from "./utils/state.js";
import { WebSocketServer } from "ws";
import { sendBigLog } from "./utils/logging";
import { ServerMessage, flattenData, getData } from "./utils/models.js";
import { insertEvent } from "./utils/events.js";

const wss = new WebSocketServer({ port: Number(process.env.PORT) });

wss.on("connection", async (ws: Socket) => {
  const state = newState(ws);

  ws.on("message", async (data) => {
    const messageData = getData(JSON.parse(data.toString()));

    if (messageData.request_type === 0) {
      // Log for Railway
      const message = data.toString();
      console.log("Device Message:", message);

      // Log for LogSnag
      const flattened = flattenData(messageData);
      sendBigLog(flattened);

      // // Add event into database
      // await insertEvent(messageData);

      // Send acknowledgment for the received message
      ws.send("ACK\r\n");
      return;
    } else {
      // Fixed response message with device settings
      // const response: ServerMessage = {
      //   device_id: messageData.device_id || "NO ID",
      //   haptic_trigger: 12,
      //   noise_trigger: 85,

      //   machine_trigger: 12,
      //   ppe_trigger: 2,
      //   access_trigger: 2,

      // // Send the response message with device settings
      // Sending fake data
      ws.send(JSON.stringify(fakeData(messageData.device_id || "123")));
      return;
    }
  });

  ws.on("pong", heartbeat);
  ws.on("close", () => close(state));
});

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));

interface DeviceData {
  device_id: string;
  sensor_haptic: SensorConfig;
  sensor_MIC: SensorConfig;
  sensor_PPE1: SensorConfig;
  sensor_PPE2: SensorConfig;
  sensor_PPE3: SensorConfig;
  sensor_access1: SensorConfig;
  sensor_access2: SensorConfig;
  sensor_access3: SensorConfig;
  sensor_forklift1: SensorConfig;
  sensor_forklift2: SensorConfig;
  sensor_forklift3: SensorConfig;
}

interface SensorConfig {
  enable: number;
  icon_display: number;
  vibration_alert: number;
  sound_alert: number;
  trigger_condition: number;
}

const fakeData = (id: string): DeviceData => {
  return {
    device_id: id,
    sensor_haptic: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 2,
    },
    sensor_MIC: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_PPE1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_PPE2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 2,
    },
    sensor_PPE3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_access1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_access2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
    sensor_access3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 2,
    },
    sensor_forklift1: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 3,
    },
    sensor_forklift2: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 2,
    },
    sensor_forklift3: {
      enable: 1,
      icon_display: 1,
      vibration_alert: 1,
      sound_alert: 1,
      trigger_condition: 1,
    },
  };
};
