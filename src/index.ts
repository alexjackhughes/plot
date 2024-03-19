import { heartbeat, keepAlive } from "./utils/keepalive.js";
import { close } from "./utils/message.js";
import { Socket, newState } from "./utils/state.js";
import { WebSocketServer } from "ws";
import { sendBigLog } from "./utils/logging";
import { ServerMessage, flattenData, getData } from "./utils/models.js";

const wss = new WebSocketServer({ port: Number(process.env.PORT) });

wss.on("connection", async (ws: Socket) => {
  const state = newState(ws);

  ws.on("message", (data) => {
    const message = data.toString();
    console.log("@alex messages");
    console.log(message);

    const messageData = getData(JSON.parse(data.toString()))

    // Send a log of the event
    const flattened = flattenData(messageData);
    sendBigLog(flattened);

    // Send acknowledgment for the received message
    ws.send("ACK\r\n");

    // Fixed response message with device settings
    const response: ServerMessage = {
      device_id: messageData.device_id || "NO ID",
      haptic_trigger: 12,
      noise_trigger: 85,

      machine_trigger: 5,
      ppe_trigger: 5,
      access_trigger: 5,
    };

    // Send the response message with device settings
    ws.send(JSON.stringify(response));
  });

  ws.on("pong", heartbeat);
  ws.on("close", () => close(state));
});

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));

interface UTCtime {
  hour: number;
  minute: number;
  second: number;
}

interface InputData {
  event_time: UTCtime;
  event_type: number;
  device_id: string;
  beacon_id: string;
  duration: number;
}

interface FlattenedData {
  [key: string]: number | string;
}

function transformAndFlattenData(inputData: InputData): FlattenedData {
  // Correct the time first if necessary
  const extraHours: number = Math.floor(inputData.event_time.minute / 60);
  const correctedMinutes: number = inputData.event_time.minute % 60;

  inputData.event_time.hour += extraHours;
  inputData.event_time.minute = correctedMinutes;

  // Function to transform keys
  const transformKey = (key: string): string =>
    key.toLowerCase().replace(/_/g, "-");

  // Flatten and transform the data
  const flattenedData: FlattenedData = {
    [transformKey("utc_time-hour")]: inputData.event_time.hour,
    [transformKey("utc_time-minute")]: inputData.event_time.minute,
    [transformKey("utc_time-second")]: inputData.event_time.second,
    [transformKey("event_type")]: inputData.event_type,
    [transformKey("device_id")]: inputData.device_id,
    [transformKey("beacon_id")]: inputData.beacon_id,
    [transformKey("duration")]: inputData.duration,
  };

  return flattenedData;
}
