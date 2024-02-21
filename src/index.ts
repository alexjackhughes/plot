import { heartbeat, keepAlive } from "./utils/keepalive.js"
import { ask } from "./utils/log.js"
import {
	close,
} from "./utils/message.js"
import { Socket, newState } from "./utils/state.js"
import { WebSocketServer } from "ws"
import { sendErrorLog, sendLog } from "./utils/logging"

interface ClientMessage {
	utc_time: {
		hour: number,
		minute: number,
		second: number,
	},
	event_type: number,
	device_id: string,
	beacon_id: string, // This is the beacon ID, we will need to hardcode these our side, so that we can map them to the correct device type
	duration: number // in seconds
}

interface ServerMessage {
	device_id: string,
	haptic_trigger: number,
	machine_trigger: number,
	ppe_trigger: number,
	access_trigger: number,
	noise_trigger: number
}

// Allowed ranges for beacon triggers:
// ● machine_trigger: 10-15m
// ● ppe_trigger: 2-3m
// ● access_trigger: 2 - 3m

const wss = new WebSocketServer( { port: Number( process.env.PORT ) } )

wss.on( "connection", async ( ws: Socket ) => {
	const state = newState( ws )

	ws.on( "message", ( data ) => {
		const message = data.toString()
		sendLog( message )

		const messageObj = JSON.parse( data.toString() ) as ClientMessage;

		// Make sure it's in the right format
		if ( !messageObj.device_id ) {
			sendErrorLog( message )
			return ws.send( "ERROR: No device_id in message\r\n" );
		}

		// TODO: If possible, it would be good at this point to use the charging station to register, the devices - but isn't required

		// Send acknowledgment for the received message
		ws.send( "ACK\r\n" );

		// TODO: Save the required data here

		// TODO: Fetch the required data here

		// Fixed response message with device settings
		const response: ServerMessage = {
			device_id: messageObj.device_id || 'NO ID', // Using the same device_id from the client message
			haptic_trigger: 10, // 2.5 m/s squared (dangerous limit), vibration levels - so in future, this will be different intensity threshold (range and time) for if there's an issue
			machine_trigger: 10, // in meters
			ppe_trigger: 3, // in meters
			access_trigger: 3, // in metersx
			noise_trigger: 86 // 60 - 120 decibels (dB) max limit
		};

		// Send the response message with device settings
		ws.send( JSON.stringify( response ) );
	} )

	ws.on( "pong", heartbeat )
	ws.on( "close", () => close( state ) )
} )

const interval = keepAlive( wss )
wss.on( "close", () => clearInterval( interval ) )