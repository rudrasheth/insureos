require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const swaggerUi = require('swagger-ui-express');
const swaggerSpecs = require('./config/swagger');
const apiRoutes = require('./routes/api');
const errorHandler = require('./middleware/errorHandler');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB().catch(err => console.error("Database Connection Failed", err));

// Security & Logging
app.use(helmet());
app.use(morgan('dev'));
app.use(cors({
    origin: '*',
    credentials: true
}));

// Middleware
// Middleware to ensure DB connection
app.use(async (req, res, next) => {
    try {
        await connectDB();
        next();
    } catch (error) {
        console.error("Database Connection Failed in Middleware:", error);
        res.status(500).json({ error: "Database Connection Failed", details: error.message });
    }
});

app.use(express.json());

// Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpecs));

// Health Check
app.get('/health', (req, res) => res.json({ status: 'UP', timestamp: new Date() }));

// DB Debug Endpoint
app.get('/db-check', async (req, res) => {
    try {
        const mongoose = require('mongoose');
        // Try to connect if not connected
        if (mongoose.connection.readyState !== 1) {
            await connectDB();
        }
        res.json({
            status: 'Connected',
            readyState: mongoose.connection.readyState,
            host: mongoose.connection.host,
            dbName: mongoose.connection.name
        });
    } catch (error) {
        res.status(500).json({
            status: 'Error',
            message: error.message,
            reason: "Likely IP Whitelist issue or paused Cluster"
        });
    }
});

// Routes
app.use('/api', apiRoutes);

// Error Handling
app.use(errorHandler);

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Docs available at http://localhost:${PORT}/api-docs`);
});
