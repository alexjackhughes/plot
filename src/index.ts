import { heartbeat, keepAlive } from "./utils/keepalive.js";
import { Socket, newState } from "./utils/state.js";
import { close } from "./utils/message.js";
import { WebSocketServer } from "ws";

import { sendBigLog } from "./app/logging.js";
import { fakeWearableSettings, flattenData, getData } from "./app/models.js";

const wss = new WebSocketServer({ port: Number(process.env.PORT) });

wss.on("connection", async (ws: Socket) => {
  const state = newState(ws);

  ws.on("message", async (data) => {
    const messageData = getData(JSON.parse(data.toString()));

    // Log for Railway
    const message = data.toString();
    console.log("Device Message:", message);

    if (messageData.request_type === 0) {
      // Log the event for LogSnag
      const flattened = flattenData(messageData);
      sendBigLog(flattened);

      // Here we insert the event into the database

      // Send acknowledgment for the received message
      ws.send("ACK\r\n");
      return;
    } else {
      // Fixed response message with device settings
      ws.send(
        JSON.stringify(fakeWearableSettings(messageData.device_id || "123")),
      );
      return;
    }
  });

  ws.on("pong", heartbeat);
  ws.on("close", () => close(state));
});

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));
