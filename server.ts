import { type ServerWebSocket } from "bun";
import { Database } from "bun:sqlite";
import { z } from "zod";
import { WSMessage } from "./src/types/schema";

type WSMessageType = z.infer<typeof WSMessage>;

// ------------------------------------------------------------
// DATABASE & STATE
// ------------------------------------------------------------
const db = new Database("bun:sqlite:messages.db");
db.run(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    json TEXT NOT NULL,
    timestamp REAL NOT NULL
  );
`);
const RECENT_LIMIT = 10000;

// ------------------------------------------------------------
// STATE & HISTORY
// ------------------------------------------------------------
const messageHistory: WSMessageType[] = [];

// Load recent messages from DB on startup
function loadRecentMessages() {
  const query = db.query(
    "SELECT json FROM messages ORDER BY timestamp DESC LIMIT ?"
  );
  const rows = query.all(RECENT_LIMIT) as { json: string }[];
  messageHistory.length = 0;
  for (const row of rows.reverse()) {
    const msg = JSON.parse(row.json) as WSMessageType;
    messageHistory.push(msg);
  }
}
loadRecentMessages();
const dashboardClients = new Set<ServerWebSocket<{ type: string }>>();

async function saveHistory() {
  // Download replay file from DB
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const filename = `replay-${timestamp}.jsonl`;

  const query = db.query("SELECT json FROM messages ORDER BY timestamp ASC");
  const rows = query.all() as { json: string }[];
  const content = rows.map((row) => row.json).join("\n");

  return new Response(content, {
    headers: {
      "Content-Type": "application/x-ndjson",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}

async function loadHistory(req: Request) {
  const formData = await req.formData();
  const file = formData.get("file") as File;
  const text = await file.text();

  // Clear DB and memory
  db.run("DELETE FROM messages");
  messageHistory.length = 0;

  let count = 0;
  text.split("\n").forEach((line) => {
    if (line.trim()) {
      try {
        const msg = JSON.parse(line);
        const result = WSMessage.safeParse(msg);
        if (result.success) {
          // Insert into DB
          const insert = db.query(
            "INSERT INTO messages (json, timestamp) VALUES (?, ?)"
          );
          insert.run(line, Date.now() / 1000); // Use current time or parse from msg?
          messageHistory.push(result.data);
          if (messageHistory.length > RECENT_LIMIT) {
            messageHistory.shift();
          }
          count++;
        }
      } catch (e) {
        console.error("Invalid message in replay file:", e);
      }
    }
  });

  // Broadcast loaded messages to existing clients
  for (const client of dashboardClients) {
    for (
      let i = messageHistory.length - count;
      i < messageHistory.length;
      i++
    ) {
      client.send(JSON.stringify(messageHistory[i]));
    }
  }

  return new Response(JSON.stringify({ loaded: count }));
}

function handleProducerMessage(message: string | Buffer<ArrayBuffer>) {
  try {
    const raw = typeof message === "string" ? JSON.parse(message) : message;
    const result = WSMessage.safeParse(raw);
    if (result.success) {
      if (result.data.type === "reset") {
        messageHistory.length = 0;
        db.run("DELETE FROM messages");
        console.log("message history cleared by producer");
      } else {
        messageHistory.push(result.data);
        // Keep only recent in memory
        if (messageHistory.length > RECENT_LIMIT) {
          messageHistory.shift();
        }
        // Save to DB
        const insert = db.query(
          "INSERT INTO messages (json, timestamp) VALUES (?, ?)"
        );
        insert.run(JSON.stringify(result.data), Date.now() / 1000); /// <reference path="e" />
      }
      const payload = JSON.stringify(result.data);
      for (const client of dashboardClients) client.send(payload);
    }
  } catch (e) {
    console.error(e);
  }
}

// ------------------------------------------------------------
// SERVER
// ------------------------------------------------------------
const server = Bun.serve({
  hostname: "0.0.0.0",
  port: 2626,
  async fetch(req, server) {
    const url = new URL(req.url);
    // Dashboard connects here
    if (url.pathname === "/metrics") {
      const success = server.upgrade(req, {
        data: { type: "dashboard" },
      });
      return success
        ? undefined
        : new Response("WS Upgrade Error", { status: 500 });
    }

    // Python script connects here
    if (url.pathname === "/publish") {
      const success = server.upgrade(req, { data: { type: "producer" } });
      return success
        ? undefined
        : new Response("WS Upgrade Error", { status: 500 });
    }

    if (url.pathname === "/download-replay") return await saveHistory();

    if (url.pathname === "/load-replay" && req.method === "POST") {
      return await loadHistory(req);
    }
    if (url.pathname === "/reset" && req.method === "POST") {
      messageHistory.length = 0;
      db.run("DELETE FROM messages");
      const payload = JSON.stringify({ type: "reset" });
      for (const client of dashboardClients) client.send(payload);
      return new Response(JSON.stringify({ status: "reset" }));
    }

    // ===========================================
    // 2. SERVE FRONTEND (React)
    // ===========================================

    // A. Check if the specific file exists in ./dist (e.g., /assets/index.js)
    // We assume your vite build outputs to "./dist"
    let filePath = "./dist" + url.pathname;

    // If root, serve index.html
    if (url.pathname === "/") filePath = "./dist/index.html";

    const file = Bun.file(filePath);
    if (await file.exists()) {
      return new Response(file);
    }

    // B. SPA Catch-all (Client-Side Routing)
    // If the user visits http://localhost:3000/layers/1, that file doesn't exist.
    // We must serve index.html and let React Router handle the logic.
    return new Response(Bun.file("./dist/index.html"));
  },

  websocket: {
    data: {} as { type: "dashboard" | "producer" },
    open(ws) {
      if (ws.data.type === "dashboard") {
        dashboardClients.add(ws);
        ws.send(JSON.stringify({ type: "history", messages: messageHistory }));
      }
    },
    message(ws, message) {
      if (ws.data.type === "producer") {
        handleProducerMessage(message);
      }
    },
    close(ws) {
      if (ws.data.type === "dashboard") dashboardClients.delete(ws);
    },
  },
});

console.log(
  `Atlas Dashboard running at http://${server.hostname}:${server.port}`
);
