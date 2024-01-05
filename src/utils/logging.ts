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
    icon: "💰",
    notify: true,
    tags: {
      plan: "premium",
      cycle: "monthly",
      trial: false,
      message: message,
    }
  })
}