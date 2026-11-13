const { httpError } = require('../utils/httpError');

function validateBody(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body || {});

    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.') || 'body'}: ${issue.message}`)
        .join('; ');
      return next(httpError(400, message, 'VALIDATION_ERROR'));
    }

    req.body = result.data;
    next();
  };
}

module.exports = { validateBody };
