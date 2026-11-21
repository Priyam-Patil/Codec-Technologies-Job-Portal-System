export function rateLimit({ limit = 100, windowMs = 60000 } = {}) {
  const clients = new Map();
  return (req, res, next) => {
    const now = Date.now();
    for (const [key, entry] of clients) if (entry.reset <= now) clients.delete(key);
    const key = req.userId || req.company?._id?.toString() || req.ip;
    const entry = clients.get(key) || { count: 0, reset: now + windowMs };
    if (!clients.has(key) && clients.size >= 10000) return res.status(429).json({ success: false, message: 'Please try again shortly' });
    clients.set(key, entry);
    if (++entry.count > limit) {
      res.set('Retry-After', String(Math.ceil((entry.reset - now) / 1000)));
      return res.status(429).json({ success: false, message: 'Too many requests. Please try again later.' });
    }
    next();
  };
}
export function errorHandler(error, req, res, next) {
  if (res.headersSent) return next(error);
  const status = error.code === 'LIMIT_FILE_SIZE' ? 413 : error.code === 11000 ? 409
    : error.name === 'ValidationError' || error.name === 'CastError' || error.name === 'MulterError' ? 400
      : error.status >= 400 && error.status < 600 ? error.status : 500;
  const publicCode = typeof error.publicCode === 'string' && /^DATABASE_[A-Z_]+$/.test(error.publicCode) ? error.publicCode : undefined;
  const message = status >= 500 ? status === 503 && publicCode ? 'Database temporarily unavailable. Try again shortly.' : 'Unable to complete this request. Please try again.'
    : error.code === 'LIMIT_FILE_SIZE' ? 'File must be 5 MB or smaller'
      : error.code === 11000 ? 'This record already exists' : error.message;
  res.status(status).json({ success: false, message, ...(publicCode ? { code: publicCode } : {}) });
}
export const securityHeaders = (req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Referrer-Policy': 'no-referrer' });
  if (req.path.startsWith('/api/users') || req.path.startsWith('/api/company')) res.set('Cache-Control', 'no-store');
  next();
};
