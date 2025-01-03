
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as SocketServer } from 'socket.io';
import { GraphData } from '../../../types';

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if ((res.socket as any).server.io) {
    console.log('Socket is already running');
  } else {
    console.log('Socket is initializing');
    const io = new SocketServer((res.socket as any).server);
    (res.socket as any).server.io = io;

    io.on('connection', socket => {
      console.log('New client connected');

      setInterval(() => {
        const mockData = generateMockData();
        socket.emit('graphUpdate', mockData);
      }, 5000);
    });
  }
  res.end();
}

function generateMockData(): GraphData {
  return {
    timestamp: new Date().toISOString(),
    idx: Math.random().toString(36).substr(2, 9),
    query: "Sample query",
    agents: [
      {
        name: "Agent 1",
        tools: [
          {
            name: "Tool 1",
            input: "Input 1",
            output: "Output 1",
            idx: "t1"
          },
          {
            name: "Tool 2",
            input: "Input 2",
            output: "Output 2",
            idx: "t2"
          }
        ],
        images: [],
        output: "Agent 1 output",
        idx: "a1"
      },
      {
        name: "Agent 2",
        tools: [
          {
            name: "Tool 3",
            input: "Input 3",
            output: "Output 3",
            idx: "t3"
          }
        ],
        images: [],
        output: "Agent 2 output",
        idx: "a2"
      }
    ],
    response: "Final response",
    total_tokens: 1909,
    is_active: true
  };
}
