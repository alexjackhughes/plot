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

    const messageData = getData(JSON.parse(data.toString()));

    if (messageData.request_type === 0) {
      // Send a log of the event
      const flattened = flattenData(messageData);
      sendBigLog(flattened);

      // Send acknowledgment for the received message
      ws.send("ACK\r\n");
    }

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
