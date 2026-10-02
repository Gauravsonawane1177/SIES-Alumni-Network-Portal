const { ZodError } = require('zod');
const { AppError } = require('../utils/errors');

function validate(schema) {
  return (req, res, next) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params
      });
      if (parsed.body) req.body = parsed.body;
      if (parsed.query) req.query = parsed.query;
      if (parsed.params) req.params = parsed.params;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(
          new AppError(
            400,
            'Validation failed',
            error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message }))
          )
        );
      }
      next(error);
    }
  };
}

module.exports = { validate };
