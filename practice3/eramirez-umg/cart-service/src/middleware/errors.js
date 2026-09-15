export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}

export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  if (error.type === 'entity.parse.failed') return res.status(400).json({ message: 'Invalid JSON body.' });
  if (error.type === 'entity.too.large') return res.status(413).json({ message: 'Request body is too large.' });
  const status = error instanceof HttpError ? error.status : 500;
  if (status >= 500) console.error('Request failed:', error.name);
  res.status(status).json({ message: error instanceof HttpError ? error.message : 'An unexpected error occurred.' });
}
