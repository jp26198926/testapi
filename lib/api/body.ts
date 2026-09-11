const MAX_BODY_SIZE = 1_000_000; // 1MB

export async function readBody(request: Request): Promise<unknown> {
  const contentLength = Number(request.headers.get("content-length") || 0);
  if (contentLength > MAX_BODY_SIZE) {
    throw new BodyTooLargeError();
  }

  const text = await request.text();
  if (text.length > MAX_BODY_SIZE) {
    throw new BodyTooLargeError();
  }

  return JSON.parse(text);
}

export class BodyTooLargeError extends Error {
  status = 413;
  constructor() {
    super("Request body too large.");
  }
}
