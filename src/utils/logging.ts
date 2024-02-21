import { LogSnag } from 'logsnag';

const logsnag = new LogSnag({
  token: process.env.LOGSNAG_TOKEN ?? '',
  project: 'spacebands',
} )


export const sendLog = async ( message: string ) => {
  await logsnag.track({
    channel: "devices",
    event: "New device message",
    user_id: "user-123",
    icon: "✅",
    notify: true,
    tags: {
      plan: "premium",
      cycle: "monthly",
      trial: false,
      message: message,
    }
  })
}

export const sendBigLog = async ( message: any ) => {
  await logsnag.track({
    channel: "devices",
    event: "New device message",
    user_id: "user-123",
    icon: "✅",
    notify: true,
    tags: {
      ...message
    }
  })
}

export const sendErrorLog = async ( message: string ) => {
  await logsnag.track({
    channel: "devices",
    event: "New error message",
    user_id: "user-123",
    icon: "❌",
    notify: true,
    tags: {
      plan: "premium",
      cycle: "monthly",
      trial: false,
      message: message,
    }
  })
}