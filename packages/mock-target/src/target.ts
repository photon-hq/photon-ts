import {Server, type Target} from "something";

export class Mock implements Target {
    async start(): Promise<boolean> {
        await Server.connect()

        console.log('Mock target started')

        return true
    }

    public sendMessage(msg: string) {
        console.log('[user] send message: ', msg)
    }
}