import { type ServerWebSocket } from "bun";
import { WSMessage } from "./src/types/schema";

// ------------------------------------------------------------
// STATE & HISTORY (Same as before)
// ------------------------------------------------------------
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const messageHistory: any[] = [];
const dashboardClients = new Set<ServerWebSocket<{ type: string }>>();

async function saveHistory() {
    // Download replay file
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const filename = `replay-${timestamp}.jsonl`;

    const content = messageHistory.map((msg) => JSON.stringify(msg)).join("\n");

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

    messageHistory.length = 0; // Clear history
    text.split("\n").forEach((line) => {
        if (line.trim()) {
            try {
                const msg = JSON.parse(line);
                const result = WSMessage.safeParse(msg);
                if (result.success) messageHistory.push(result.data);
            } catch (e) {
                console.error("Invalid message in replay file:", e);
            }
        }
    });

    // Notify all dashboards
    const payload = JSON.stringify({
        type: "replay_loaded",
        count: messageHistory.length,
    });
    for (const client of dashboardClients) client.send(payload);

    return new Response(JSON.stringify({ loaded: messageHistory.length }));
}

function handleProducerMessage(message: string | Buffer<ArrayBuffer>) {
    try {
        const raw = typeof message === "string" ? JSON.parse(message) : message;
        const result = WSMessage.safeParse(raw);
        if (result.success) {
            if (result.data.type === "reset") {
                messageHistory.length = 0;
                console.log("message history cleared by producer");
            } else {
                messageHistory.push(result.data);
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
    port: 3000,
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
                for (const msg of messageHistory) ws.send(JSON.stringify(msg));
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
