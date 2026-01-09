# Atlas Dashboard API Guide

This document outlines the API for the Atlas Dashboard dashboard, allowing users to create custom clients and data producers.

## 1. Starting the Server

The application uses **Bun** as a runtime and **Vite** for the frontend build. The server runs on port **2626** by default.

### Development Mode (Recommended for client development)

This mode runs the Vite development server and the Bun WebSocket/HTTP server concurrently.

```bash
bun install
bun run serve dev
```

### Production Mode

This mode builds the frontend assets before starting the Bun server.

```bash
bun install
bun run build
bun run serve
```

The dashboard will be available at `http://localhost:2626`.

## 2. HTTP Endpoints

These endpoints are exposed on the main server port (2626).

| Method | Path | Description | Request Body | Response Body |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/` | Serves the React single-page application (SPA). | None | HTML content |
| `GET` | `/download-replay` | Downloads the current message history as a `.jsonl` (JSON Lines) file. | None | `application/x-ndjson` file |
| `POST` | `/load-replay` | Clears the current history and loads a new history from an uploaded `.jsonl` file. | `multipart/form-data` with a `file` field. | `{"loaded": number of messages}` |
| `POST` | `/reset` | Clears the message history and sends a `reset` message to all connected dashboards. | None | `{"status": "reset"}` |

## 3. WebSocket Endpoints

The server exposes two distinct WebSocket endpoints, differentiated by their roles: producer (data source) and dashboard (data consumer).

### 3.1. Producer Endpoint (Data Ingestion)

* **URL:** `ws://<server_address>:2626/publish`
* **Role:** Used by external scripts (e.g., training frameworks) to send real-time metrics to the dashboard.
* **Protocol:** Messages must be JSON strings conforming to the `WSMessage` schema.

### 3.2. Dashboard Endpoint (Data Consumption)

* **URL:** `ws://<server_address>:2626/metrics`
* **Role:** Used by the main web dashboard or custom clients to receive metrics.
* **Protocol:**
    1. On connection, the client receives the entire history of messages.
    2. After history, the client receives new `WSMessage` updates in real-time as they are published by producers.

## 4. WebSocket Message Schemas (`WSMessage`)

The primary data structure is a discriminated union based on the `type` field.

### 4.1. `layer_update`

Used to report per-layer/per-module metrics (e.g., weights, gradients).

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `type` | literal(`"layer_update"`) | Message discriminator. | `"layer_update"` |
| `layer_id` | `number` | Unique ID for the layer/module. | `0` |
| `step` | `number` | Current training step. | `1234` |
| `metrics` | `Record<string, number>` | Key-value pairs of metrics for the layer. | `{"mean": 0.5123, "stddev": 1.004, "absmax": 3.45}` |

### 4.2. `global_update`

Used to report high-level training or optimizer metrics (e.g., loss, MFU).

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `type` | literal(`"global_update"`) | Message discriminator. | `"global_update"` |
| `step` | `number` | Current training step. | `1234` |
| `metrics` | `Record<string, number>` | Key-value pairs of global metrics. | `{"loss": 2.45, "mfu": 45.0, "throughput": 120000000}` |

### 4.3. `gpu_update`

Used to report real-time GPU hardware metrics.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `type` | literal(`"gpu_update"`) | Message discriminator. | `"gpu_update"` |
| `id` | `number` | Unique ID for the GPU. | `0` |
| `timestamp` | `number` | Unix timestamp of the reading. | `1721590000` |
| `metrics` | `Record<string, number \| string \| null>` | Key-value pairs of hardware metrics. | `{"temp": 48, "perf": "P1", "mem_usg": 10245}` |

### 4.4. `static_metrics`

Used to report static system/driver information once per session.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `type` | literal(`"static_metrics"`) | Message discriminator. | `"static_metrics"` |
| `metrics` | `object` | Static system information. | `{"smi_ver": "12.3", "cuda_ver": "12.2", "driver_ver": "535.54.03"}` |

### 4.5. `reset`

Used to signal that the entire training session has been reset and history should be cleared.

| Field | Type | Description | Example |
| :--- | :--- | :--- | :--- |
| `type` | literal(`"reset"`) | Message discriminator. | `"reset"` |
