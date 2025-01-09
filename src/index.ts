import { heartbeat, keepAlive } from "./utils/keepalive.js";
import { Socket, newState } from "./utils/state.js";
import { close } from "./utils/message.js";
import { WebSocketServer } from "ws";

import { sendBigLog } from "./app/logging.js";
import { getData } from "./app/data.js";
import { sendData } from "./app/sendData.js";
import { receiveData } from "./app/receiveData.js";
import { findChargerTimezone } from "./app/chargerTimezone.js";
import { groupHAVs } from "./app/groupHAVs.js";

const wss = new WebSocketServer({ port: Number(process.env.PORT) });

wss.on("connection", async (ws: Socket) => {
  const state = newState(ws);

  ws.on("message", async (data) => {
    try {
      console.log("Raw data:", data.toString());
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
    console.log("Raw Device Message:", message);

    if (messageData.request_type === 0) {
      try {
        // Log the event for LogSnag
        // const flattened = flattenData(messageData);
        // sendBigLog(flattened);

        if (process.env.FAKE_DB === "true") return;

        // Here we insert the event into the database
        await receiveData(messageData);
      } catch (error) {
        console.error("Error saving data:", error);
        sendBigLog({ problem: "Error saving data", ...error });
      } finally {
        // Send acknowledgment for the received message
        ws.send("ACK\r\n");
      }

      return;
    } else if (messageData.request_type === 1) {
      let data = await sendData(messageData);
      ws.send(JSON.stringify(data));

      return;
    } else if (messageData.request_type === 2) {
      // sendBigLog(messageData);
      const chargerId = messageData.charger_id.replace(/[^\d]/g, "");

      // 10 is the DEFAULT firmware we know works
      ws.send(
        JSON.stringify({
          firmware_version: "2.2.10",
        }),
      );
      return;
    } else if (messageData.request_type === 3) {
      const chargerId = messageData.charger_id.replace(/[^\d]/g, "");
      const timezone = await findChargerTimezone(chargerId);

      ws.send(
        JSON.stringify({
          request_timezone: timezone,
        }),
      );

      return;
    } else if (messageData.request_type === 4) {
      const wearableId = messageData.device_id.replace(/[^\d]/g, ""); // should only be 9999

      // This the OTA firmware version for testing
      if (
        wearableId === "9999" ||
        wearableId === "0135" ||
        wearableId === "0146"
      ) {
        ws.send(
          JSON.stringify({
            firmware_version: "1.3.37",
          }),
        );
      }

      // This is the default firmware version
      ws.send(
        JSON.stringify({
          firmware_version: "1.3.35",
        }),
      );

      return;
    }

    if (messageData.request_type === 5) {
      await groupHAVs(messageData.device_id);

      ws.send(
        JSON.stringify({
          message: "working",
        }),
      );
    }
  });

  ws.on("pong", heartbeat);
  ws.on("close", () => close(state));
});

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));
