import express from "express";
import { nanoid } from "nanoid";

// @ts-ignore
import { handler as ssrHandler } from "./dist/server/entry.mjs";
import WebSocket, { Server, WebSocketServer } from "ws";

let app = express();
app.use(express.static("dist/client/"));
app.use(ssrHandler);

const wss = new WebSocketServer({
  server: app.listen(3000),
});

class Player {
  id: string;
  constructor(id: string) {
    this.id = id;
    players.set(id, this);
  }
}

interface MyWebSocket extends WebSocket {
  id?: string;
}

// let players: { [key: string]: Player } = {};
let players = new Map();

wss.on("connection", function connection(ws: MyWebSocket) {
  ws.id = nanoid();
  new Player(ws.id);
  // ws.on("open", (ws: MyWebSocket, req: Request) => {});
  ws.on("message", function message(data) {
    if (data.toString() === "fire") {
      wss.clients.forEach((client: MyWebSocket) => {
        console.log(
          `sending \'sounds good\' to client with id of ${client.id}`
        );
        console.log(players);
        client.send("sounds good");
      });
    }
    console.log("received: %s", data);
  });
  ws.on("close", (code, reason) => {
    console.log(code, reason.toString());
    console.log(`removing ${ws.id} from players`);
    players.delete(ws.id);
  });
});
