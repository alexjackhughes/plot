import { heartbeat, keepAlive } from "./utils/keepalive.js";
import { Socket, newState } from "./utils/state.js";
import { close } from "./utils/message.js";
import { WebSocketServer } from "ws";

import { sendBigLog } from "./app/logging.js";
import { flattenData, getData } from "./app/data.js";
import { sendData } from "./app/sendData.js";
import { receiveData } from "./app/receiveData.js";

const wss = new WebSocketServer({ port: Number(process.env.PORT) });

wss.on("connection", async (ws: Socket) => {
  const state = newState(ws);

  ws.on("message", async (data) => {
    try {
      const rawData = JSON.parse(data.toString());

      if (
        !rawData ||
        !(typeof rawData === "object") ||
        !("request_type" in rawData)
      ) {
        console.log("Error parsing data");
        ws.send("ACK\r\n");
        return;
      }
    } catch (error) {
      console.log("Error parsing data");
      ws.send("ACK\r\n");
      return;
    }

    // Otherwise format the data nicely
    const messageData = getData(JSON.parse(data.toString()));

    // Log for Railway
    const message = data.toString();
    console.log("Raw Device Message:", message, messageData.request_type);

    if (messageData.request_type === 0) {
      try {
        // Log the event for LogSnag
        const flattened = flattenData(messageData);
        sendBigLog(flattened);

        if (process.env.FAKE_DB === "true") return;

        // Here we insert the event into the database
        await receiveData(messageData);
      } catch (error) {
        console.error("Error saving data:", error);
      } finally {
        // Send acknowledgment for the received message
        ws.send("ACK\r\n");
      }

      return;
    } else if (messageData.request_type === 1) {
      console.log("Sending settings:");

      if (process.env.FAKE_DB === "true") return;

      // Fetch the settings and send them back to the device
      let data = await sendData(messageData);
      ws.send(JSON.stringify(data));
      return;
    } else {
      sendBigLog(messageData);
      const chargerId = messageData.charger_id.replace(/[^\d]/g, "");

      if (["0005"].includes(chargerId)) {
        ws.send(
          JSON.stringify({
            firmware_version: "2.2.7",
          }),
        );
        return;
      }

      ws.send(
        JSON.stringify({
          firmware_version: "2.2.6",
        }),
      );
      return;
    }
  });

  ws.on("pong", heartbeat);
  ws.on("close", () => close(state));
});

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));
