import { Server } from "http";
import WebSocket from "ws";
import { WebSocketServer } from "ws";

const connectedClients = new Set<WebSocket>();

export const initWebSocketServer = (httpServer: Server): WebSocketServer => {
  let wss = new WebSocketServer({ server: httpServer });

  wss.on("connection", (ws: WebSocket) => {
    console.log("🤖New Client Connected");
    connectedClients.add(ws); // Add the connected Server

    ws.on("close", () => {
      console.log(
        `Client closed the connection! Total Clients Remaining:${connectedClients.size}`,
      );
      connectedClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.log(
        `Client closed the connection! Total Clients Remaining:${connectedClients.size}`,
      );
      connectedClients.delete(ws);
    });
  });

  return wss;
};

export const broadcastTelemetry = (type: "metrics" | "logs", data: any) => {
  const payload = JSON.stringify({ type, data, time: new Date() });

  for (const client of connectedClients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(payload);
    }
  }
};
