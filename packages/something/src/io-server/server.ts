import {io} from "socket.io-client";

export const Server = {
    connect: () => {
        return new Promise<void>((resolve) => {
            const socket = io('http://localhost:4001', {
                transports: ['websocket']
            });

            socket.on('connect', () => {
                console.log('Connected:', socket.id);
                resolve();
            });

            socket.on('disconnect', () => {
                console.log('Disconnected:', socket.id);
            });
        });
    }
}