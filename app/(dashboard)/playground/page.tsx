"use client";

import { useState } from "react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

export default function PlaygroundPage() {
  const [method, setMethod] = useState<(typeof METHODS)[number]>("GET");
  const [endpoint, setEndpoint] = useState("/api/public/posts");
  const [headers, setHeaders] = useState(
    'Content-Type: application/json\nAuthorization: Bearer YOUR_API_KEY'
  );
  const [body, setBody] = useState("");
  const [response, setResponse] = useState("");
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSend() {
    setLoading(true);
    setResponse("");
    setStatusCode(null);
    setResponseTime(null);

    const headerObj: Record<string, string> = {};
    headers.split("\n").forEach((line) => {
      const [key, ...rest] = line.split(":");
      if (key && rest.length > 0) {
        headerObj[key.trim()] = rest.join(":").trim();
      }
    });

    // Remove auth header if placeholder
    if (headerObj.Authorization === "Bearer YOUR_API_KEY") {
      delete headerObj.Authorization;
    }

    const start = performance.now();
    try {
      const res = await fetch(endpoint, {
        method,
        headers: headerObj,
        body: ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
      });

      const elapsed = Math.round(performance.now() - start);
      setResponseTime(elapsed);
      setStatusCode(res.status);

      const text = await res.text();
      try {
        setResponse(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponse(text);
      }
    } catch (err) {
      setResponse(`Error: ${err instanceof Error ? err.message : "Request failed"}`);
    }
    setLoading(false);
  }

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API Playground</h1>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* Request panel */}
        <div className="space-y-4">
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as typeof method)}
              className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <input
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              placeholder="/api/public/posts"
              className="flex-1 rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Headers</label>
            <textarea
              value={headers}
              onChange={(e) => setHeaders(e.target.value)}
              rows={3}
              className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {["POST", "PUT", "PATCH"].includes(method) && (
            <div>
              <label className="block text-sm font-medium">Request Body</label>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="mt-1 block w-full rounded-md border border-zinc-300 px-3 py-2 font-mono text-sm dark:border-zinc-700 dark:bg-zinc-900"
                placeholder='{"key": "value"}'
              />
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={handleSend}
              disabled={loading}
              className="rounded-md bg-black px-6 py-2 text-sm text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black"
            >
              {loading ? "Sending..." : "Send"}
            </button>
            <button
              onClick={() => {
                setResponse("");
                setStatusCode(null);
                setResponseTime(null);
              }}
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Clear
            </button>
            <button
              onClick={() =>
                handleCopy(
                  `curl -X ${method} "${endpoint}"${method !== "GET" ? ` -d '${body}'` : ""}`
                )
              }
              className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
            >
              Copy cURL
            </button>
          </div>
        </div>

        {/* Response panel */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <h2 className="text-sm font-medium">Response</h2>
            {statusCode && (
              <span
                className={`rounded px-2 py-0.5 text-xs font-medium ${
                  statusCode < 300
                    ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
                    : statusCode < 500
                      ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-300"
                      : "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
                }`}
              >
                {statusCode}
              </span>
            )}
            {responseTime !== null && (
              <span className="text-xs text-zinc-500">{responseTime}ms</span>
            )}
            {response && (
              <button
                onClick={() => handleCopy(response)}
                className="ml-auto text-xs underline"
              >
                Copy
              </button>
            )}
          </div>
          <pre className="min-h-[300px] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950">
            {response || "Response will appear here..."}
          </pre>
        </div>
      </div>
    </div>
  );
}
