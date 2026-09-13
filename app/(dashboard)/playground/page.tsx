"use client";

import { useState } from "react";

const METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE"] as const;

const DEFAULT_WRITE_BODY = '{\n  "data": {\n    "title": "Hello",\n    "content": "World"\n  }\n}';

const API_REFERENCE = [
  { method: "GET", endpoint: "/api/public/{slug}", body: null, description: "List records in a public collection (read-only, no auth)" },
  { method: "GET", endpoint: "/api/collection/{collectionId}/{slug}", body: null, description: "List records in your collection" },
  { method: "POST", endpoint: "/api/collection/{collectionId}/{slug}", body: '{"data": {...}}', description: "Create a new record" },
  { method: "GET", endpoint: "/api/collection/{collectionId}/{slug}/{recordId}", body: null, description: "Get a single record" },
  { method: "PUT", endpoint: "/api/collection/{collectionId}/{slug}/{recordId}", body: '{"data": {...}}', description: "Replace a record entirely" },
  { method: "PATCH", endpoint: "/api/collection/{collectionId}/{slug}/{recordId}", body: '{"data": {...}}', description: "Partially update a record" },
  { method: "DELETE", endpoint: "/api/collection/{collectionId}/{slug}/{recordId}", body: null, description: "Delete a record" },
];

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
  const [bodyError, setBodyError] = useState<string | null>(null);
  const [showRef, setShowRef] = useState(false);

  function handleMethodChange(newMethod: (typeof METHODS)[number]) {
    setMethod(newMethod);
    setBodyError(null);
    if (["POST", "PUT", "PATCH"].includes(newMethod) && !body) {
      setBody(DEFAULT_WRITE_BODY);
    }
  }

  async function handleSend() {
    setLoading(true);
    setResponse("");
    setStatusCode(null);
    setResponseTime(null);
    setBodyError(null);

    // Validate JSON body for write methods
    let requestBody: string | undefined;
    if (["POST", "PUT", "PATCH"].includes(method)) {
      if (body.trim()) {
        try {
          JSON.parse(body);
          requestBody = body;
        } catch {
          setBodyError("Invalid JSON in request body");
          setLoading(false);
          return;
        }
      }
    }

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
        body: requestBody,
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

  function buildCurl() {
    const parts = [`curl -X ${method} "${endpoint}"`];
    const isWrite = ["POST", "PUT", "PATCH"].includes(method);
    if (isWrite && body.trim()) {
      parts.push(`-H 'Content-Type: application/json'`);
      parts.push(`-d '${body.replace(/\n\s*/g, " ")}'`);
    }
    return parts.join(" \\\n  ");
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">API Playground</h1>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Request panel */}
        <div className="space-y-4">
          <div className="flex flex-col gap-2 sm:flex-row">
            <select
              value={method}
              onChange={(e) => handleMethodChange(e.target.value as typeof method)}
              className="rounded-md border border-zinc-300 px-3 py-2 dark:border-zinc-700 dark:bg-zinc-900 sm:w-auto"
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
              placeholder="/api/collection/{collectionId}/{slug}"
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
                onChange={(e) => {
                  setBody(e.target.value);
                  setBodyError(null);
                }}
                rows={6}
                className={`mt-1 block w-full rounded-md border px-3 py-2 font-mono text-sm dark:bg-zinc-900 ${
                  bodyError
                    ? "border-red-300 dark:border-red-700"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
                placeholder='{ "data": { "key": "value" } }'
              />
              {bodyError && (
                <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                  {bodyError}
                </p>
              )}
              <p className="mt-1 text-xs text-zinc-500">
                Record data must be wrapped in a {"{"}&quot;data&quot;: ...{"}"} object
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
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
              onClick={() => handleCopy(buildCurl())}
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
          <pre className="min-h-[200px] overflow-auto rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm dark:border-zinc-800 dark:bg-zinc-950 md:min-h-[300px]">
            {response || "Response will appear here..."}
          </pre>
        </div>
      </div>

      {/* API Reference */}
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setShowRef(!showRef)}
          className="flex w-full items-center justify-between px-4 py-3 text-left"
        >
          <h2 className="text-sm font-semibold">API Reference</h2>
          <span className="text-xs text-zinc-500">
            {showRef ? "Hide" : "Show"}
          </span>
        </button>
        {showRef && (
          <div className="overflow-x-auto border-t border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 dark:bg-zinc-900">
                <tr>
                  <th className="px-4 py-2 text-xs font-medium uppercase text-zinc-500">Method</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase text-zinc-500">Endpoint</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase text-zinc-500">Body</th>
                  <th className="px-4 py-2 text-xs font-medium uppercase text-zinc-500">Description</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                {API_REFERENCE.map((ref, i) => (
                  <tr key={i} className="hover:bg-zinc-50 dark:hover:bg-zinc-900">
                    <td className="px-4 py-2">
                      <span className={`inline-block rounded px-2 py-0.5 text-xs font-medium ${
                        ref.method === "GET" ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400" :
                        ref.method === "POST" ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400" :
                        ref.method === "PUT" ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400" :
                        ref.method === "PATCH" ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-400" :
                        "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-400"
                      }`}>
                        {ref.method}
                      </span>
                    </td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-700 dark:text-zinc-300">{ref.endpoint}</td>
                    <td className="px-4 py-2 font-mono text-xs text-zinc-500">{ref.body || "-"}</td>
                    <td className="px-4 py-2 text-xs text-zinc-600 dark:text-zinc-400">{ref.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
