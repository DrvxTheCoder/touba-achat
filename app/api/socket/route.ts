// app/api/socket/route.ts
import { NextResponse } from 'next/server';
import { Server as SocketIO } from 'socket.io';

let io: SocketIO;

export async function GET() {
  if (!io) {
    console.log('Socket is initializing');
    if (!(global as any).server) {
      throw new Error('HTTP server is not initialized');
    }
    io = new SocketIO((global as any).server, {
      path: '/api/socket',
      addTrailingSlash: false,
    });

    io.on('connection', (socket) => {
      console.log('A user connected', socket.id);
      
      socket.on('simulate_notification', (data) => {
        console.log('Simulating notification:', data);
        io.emit('notification', data);
      });

      socket.on('disconnect', () => {
        console.log('User disconnected', socket.id);
      });
    });
  } else {
    console.log('Socket is already running');
  }

  return NextResponse.json({ success: true });
}

export const dynamic = 'force-dynamic';