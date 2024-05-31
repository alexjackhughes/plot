import { heartbeat, keepAlive } from "./utils/keepalive.js";
import { Socket, newState } from "./utils/state.js";
import { close } from "./utils/message.js";
import { WebSocketServer } from "ws";

import { sendBigLog } from "./app/logging.js";
import { flattenData, getData } from "./app/models.js";
import { sendData } from "./app/sendData.js";
import { receiveData } from "./app/receiveData.js";

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
      await receiveData(messageData);

      // Send acknowledgment for the received message
      ws.send("ACK\r\n");
      return;
    } else {
      // Fetch the settings and send them back to the device
      const data = await sendData(messageData);
      ws.send(JSON.stringify(data));
      return;
    }
  });

  ws.on("pong", heartbeat);
  ws.on("close", () => close(state));
});

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));
