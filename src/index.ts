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
      let data = await sendData(messageData);
      ws.send(JSON.stringify(data));

      return;
    } else if (messageData.request_type === 2) {
      sendBigLog(messageData);
      const chargerId = messageData.charger_id.replace(/[^\d]/g, "");
      const taiwan = ["3000", "4000", "5000", "9999", "0000"];
      const chargersForTesting = ["0005", "0011", "0014", "0010"];

      if (taiwan.includes(chargerId)) {
        ws.send(
          JSON.stringify({
            firmware_version: "2.2.10",
          }),
        );
        return;
      }

      if (chargersForTesting.includes(chargerId)) {
        ws.send(
          JSON.stringify({
            firmware_version: "2.2.9",
          }),
        );
        return;
      }

      ws.send(
        JSON.stringify({
          firmware_version: "2.2.9",
        }),
      );
      return;
    } else if (messageData.request_type === 3) {
      const chargerId = messageData.charger_id.replace(/[^\d]/g, "");
      const westCoastAmerica = ["3000", "0014", "0021"];
      const westCoastCanada = ["4000", "0010", "0047"];
      const germany = ["0034"];
      const taiwan = ["3000", "4000", "5000", "9999", "0000"];

      if (westCoastAmerica.includes(chargerId)) {
        ws.send(
          JSON.stringify({
            request_timezone: "GMT-7",
          }),
        );
        return;
      }

      if (germany.includes(chargerId)) {
        ws.send(
          JSON.stringify({
            request_timezone: "GMT+1",
          }),
        );
        return;
      }

      if (taiwan.includes(chargerId)) {
        ws.send(
          JSON.stringify({
            request_timezone: "GMT+8",
          }),
        );
        return;
      }

      if (westCoastCanada.includes(chargerId)) {
        ws.send(
          JSON.stringify({
            request_timezone: "GMT-7GMT,GMT-6,M3.2.0/2:00:00,M11.1.0/2:00:00",
          }),
        );
        return;
      }

      sendBigLog(messageData);

      // Get the current date
      const now = new Date();

      // Check if it's currently British Summer Time (BST)
      const isBST =
        now
          .toLocaleString("en-US", {
            timeZone: "Europe/London",
            timeZoneName: "short",
          })
          .split(" ")[2] === "BST";

      ws.send(
        JSON.stringify({
          request_timezone: isBST ? "GMT+0" : "GMT+0",
        }),
      );
      return;
    } else {
      console.log("Unknown request type");
      return;
    }
  });

  ws.on("pong", heartbeat);
  ws.on("close", () => close(state));
});

const interval = keepAlive(wss);
wss.on("close", () => clearInterval(interval));
