const { ZodError } = require('zod');

const errorHandler = (err, req, res, next) => {
    console.error(err);

    if (err instanceof ZodError) {
        return res.status(400).json({
            error: 'Validation Error',
            details: err.errors,
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            error: 'Conflict',
            message: `A record with this ${field} already exists`,
        });
    }

    // Mongoose CastError (invalid ID)
    if (err.name === 'CastError') {
        return res.status(400).json({
            error: 'Invalid ID',
            message: 'Resource not found',
        });
    }

    res.status(500).json({
        error: 'Internal Server Error',
        message: err.message || 'Something went wrong',
    });
};

module.exports = errorHandler;
