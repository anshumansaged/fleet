const { Prisma } = require('@prisma/client');

const errorHandler = (err, req, res, _next) => {
  console.error('Error:', err.message);

  // Prisma validation error
  if (err instanceof Prisma.PrismaClientValidationError) {
    return res.status(400).json({ error: 'Validation error', details: [err.message] });
  }

  // Prisma unique constraint violation
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
    const field = err.meta?.target?.join(', ') || 'field';
    return res.status(409).json({ error: `Duplicate value for ${field}` });
  }

  // Prisma record not found
  if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found' });
  }

  const status = err.statusCode || 500;
  res.status(status).json({
    error: status === 500 ? 'Internal server error' : err.message,
  });
};

module.exports = errorHandler;
