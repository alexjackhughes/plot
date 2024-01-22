import { heartbeat, keepAlive } from "./utils/keepalive.js"
import { ask } from "./utils/log.js"
import {
	close,
} from "./utils/message.js"
import { Socket, newState } from "./utils/state.js"
import { WebSocketServer } from "ws"
import { sendLog } from "./utils/logging"

// Define types for clarity
interface ClientMessage {
    utc_time: {
        hour: number,
        minute: number,
        second: number,
    },
    event_type: number,
    device_id: string,
    beacon_id: string,
    duration: number
}

interface ServerMessage {
    device_id: string,
    haptic_trigger: number,
    beacon_trigger: number,
    noise_trigger: number
}

const wss = new WebSocketServer({ port: Number(process.env.PORT) })

wss.on("connection", (ws: Socket) => {
	const state = newState( ws )

	ws.on("message", (data) => {
		const message = data.toString()
		sendLog( message )

		const messageObj = JSON.parse( data.toString() ) as ClientMessage;

		// Make sure it's in the right format
		if ( !messageObj.device_id ) {
			return ws.send( "ERROR: No device_id in message\r\n" );
		}

		// Send acknowledgment for the received message
		ws.send("ACK\r\n");

		// Fixed response message with device settings
		const response: ServerMessage = {
				device_id: messageObj.device_id, // Using the same device_id from the client message
				haptic_trigger: 2, // Fixed value
				beacon_trigger: 5, // Fixed value
				noise_trigger: 85 // Fixed value
		};

		// Send the response message with device settings
		ws.send(JSON.stringify(response));
	})

	ws.on("pong", heartbeat)
	ws.on("close", () => close(state))
})

const interval = keepAlive(wss)
wss.on("close", () => clearInterval(interval))