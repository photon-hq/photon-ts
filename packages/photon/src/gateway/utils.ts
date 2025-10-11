import { Socket } from "socket.io-client";

declare module "socket.io-client" {
    interface Socket {
        asyncEmit(event: string, ...args: any[]): Promise<void>;
    }
}

Socket.prototype.asyncEmit = async function(event: string, ...args: any[]): Promise<void> {
    return new Promise((resolve, reject) => {
        this.emit(event, ...args, (err: Error | null) => {
            if (err) reject(err);
            else resolve();
        });
    });
};

// biome-ignore lint: This explore is nesscarry for the type checking of the registry.
export { }