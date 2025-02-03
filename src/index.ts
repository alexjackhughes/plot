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
        console.log("Error parsing data", rawData);
        ws.send("ACK\r\n");
        return;
      }
    } catch (error) {
      console.log("Error parsing data", error);
      ws.send("ACK\r\n");
      return;
    }

    // Otherwise format the data nicely
    const messageData = getData(JSON.parse(data.toString()));

    // Log for Railway
    // const message = data.toString();
    // console.log("Raw Device Message:", message);

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

      const testingChargers = [
        "0015",
        "0023",
        "0030",
        "0036",
        "0037",
        "0038",
        "0039",
        "0040",
        "0041",
        "0043",
        "0045",
        "0046",
        "0048",
        "0049",
        "0051",
        "0052",
        "0053",
        "0054",
        "0055",
        "0056",
        "0057",
        "0058",
        "0059",
        "0060",
        "0061",
        "0062",
        "0063",
        "0064",
        "0065",
        "0066",
        "0067",
        "0068",
        "0050",
        "0069",
        "0070",
        "0071",
        "0072",
        "0075",
        "0076",
        "0077",
        "0078",
        "0080",
        "0081",
        "0082",
        "0083",
        "0084",
        "0085",
        "0086",
        "0090",
        "0091",
        "0093",
        "9999",
        "9912",
      ];

      // Testing charger
      if (testingChargers.includes(chargerId)) {
        ws.send(
          JSON.stringify({
            firmware_version: "2.2.12",
          }),
        );
        return;
      }

      // 12 is the DEFAULT firmware we know works
      ws.send(
        JSON.stringify({
          firmware_version: "2.2.12",
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
        wearableId === "0146" ||
        wearableId === "0136" ||
        wearableId === "0121"
      ) {
        ws.send(
          JSON.stringify({
            firmware_version: "1.3.38",
          }),
        );
        return;
      }

      // This is the default firmware version
      ws.send(
        JSON.stringify({
          firmware_version: "1.3.36",
        }),
      );

      return;
    } else if (messageData.request_type === 5) {
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
