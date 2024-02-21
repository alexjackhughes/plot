import { heartbeat, keepAlive } from "./utils/keepalive.js"
import {
	close,
} from "./utils/message.js"
import { Socket, newState } from "./utils/state.js"
import { WebSocketServer } from "ws"
import { sendBigLog, sendErrorLog } from "./utils/logging"

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
		console.log( 'message' )
		console.log( message )

		const messageObj = JSON.parse( data.toString() ) as ClientMessage;

		transformAndFlattenData(messageObj)
		sendBigLog( message )

		// Make sure it's in the right format
		if ( !messageObj.device_id ) {
			sendErrorLog( message )
			return ws.send( "ERROR: No device_id in message\r\n" );
		}

		// Send acknowledgment for the received message
		ws.send( "ACK\r\n" );

		// Fixed response message with device settings
		const response: ServerMessage = {
			device_id: messageObj.device_id || 'NO ID', // Using the same device_id from the client message
			haptic_trigger: 12, // 2.5 m/s squared (dangerous limit), vibration levels - so in future, this will be different intensity threshold (range and time) for if there's an issue
			noise_trigger: 85, // 60 - 120 decibels (dB) max limit

			machine_trigger: 5, // in meters
			ppe_trigger: 5, // in meters
			access_trigger: 5 // in meters
		};

		// Send the response message with device settings
		ws.send( JSON.stringify( response ) );
	} )

	ws.on( "pong", heartbeat )
	ws.on( "close", () => close( state ) )
} )

const interval = keepAlive( wss )
wss.on( "close", () => clearInterval( interval ) )


interface UTCtime {
  hour: number;
  minute: number;
  second: number;
}

interface InputData {
  utc_time: UTCtime;
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
  const extraHours: number = Math.floor(inputData.utc_time.minute / 60);
  const correctedMinutes: number = inputData.utc_time.minute % 60;

  inputData.utc_time.hour += extraHours;
  inputData.utc_time.minute = correctedMinutes;

  // Function to transform keys
  const transformKey = (key: string): string =>
    key.toLowerCase().replace(/_/g, '-');

  // Flatten and transform the data
  const flattenedData: FlattenedData = {
    [transformKey('utc_time-hour')]: inputData.utc_time.hour,
    [transformKey('utc_time-minute')]: inputData.utc_time.minute,
    [transformKey('utc_time-second')]: inputData.utc_time.second,
    [transformKey('event_type')]: inputData.event_type,
    [transformKey('device_id')]: inputData.device_id,
    [transformKey('beacon_id')]: inputData.beacon_id,
    [transformKey('duration')]: inputData.duration,
  };

  return flattenedData;
}