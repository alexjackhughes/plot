import { heartbeat, keepAlive } from "./utils/keepalive.js"
import { ask } from "./utils/log.js"
import {
	close,
} from "./utils/message.js"
import { Socket, newState } from "./utils/state.js"
import { WebSocketServer } from "ws"
import { sendLog } from "./utils/logging"

const wss = new WebSocketServer({ port: Number(process.env.PORT) })

wss.on("connection", (ws: Socket) => {
	const state = newState( ws )

	ws.on("message", (data) => {
		const message = data.toString()

		sendLog(message)
	})

	ws.on("pong", heartbeat)
	ws.on("close", () => close(state))
})

const interval = keepAlive(wss)
wss.on("close", () => clearInterval(interval))