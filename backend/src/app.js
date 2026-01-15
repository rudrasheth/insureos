const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// Fix BigInt serialization
BigInt.prototype.toJSON = function () { return Number(this) };

// Security & Logging
app.use(helmet());
app.use(morgan('dev'));
app.use(cors());

// Middleware
app.use(express.json());

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health Check
app.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

// Routes
app.use('/api', apiRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Docs available at http://localhost:${PORT}/api-docs`);
});
