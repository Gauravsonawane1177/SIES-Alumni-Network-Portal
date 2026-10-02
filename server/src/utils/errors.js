class AppError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
  }
}

function success(res, data = {}, message = 'OK', status = 200) {
  return res.status(status).json({ success: true, message, data });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      details: err.details || undefined
    });
  }

  if (err.code === '23505') {
    return res.status(409).json({ success: false, message: 'A record with these values already exists' });
  }
  if (err.code === '23503') {
    return res.status(400).json({ success: false, message: 'Related record was not found' });
  }
  if (err.code === '22P02') {
    return res.status(400).json({ success: false, message: 'Invalid identifier format' });
  }

  console.error('Unhandled error:', err.message);
  return res.status(500).json({ success: false, message: 'Internal server error' });
}

function notFound(req, res) {
  return res.status(404).json({ success: false, message: `Route not found: ${req.method} ${req.originalUrl}` });
}

module.exports = { AppError, success, errorHandler, notFound };
