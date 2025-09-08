import { io } from 'socket.io-client';

export function connectSomethingServer() {
    const socket = io('http://localhost:3000', {
        transports: ['websocket']
    });

    socket.on('connect', () => {
        console.log('Connected:', socket.id);
    });

    socket.on('disconnect', () => {
        console.log('Disconnected:', socket.id);
    });
}