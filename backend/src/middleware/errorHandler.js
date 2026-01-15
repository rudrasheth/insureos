const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors,
        });
    }

    // Prisma unique constraint violation
    if (err.code === 'P2002') {
        return res.status(409).json({
            error: 'Conflict',
            message: 'A record with this field already exists',
        });
    }

    if (err.code === 'P2025') {
        return res.status(404).json({
            error: 'Not Found',
            message: 'Record not found',
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong',
    });
};

module.exports = errorHandler;
