const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Customer & Policy Management API',
            version: '1.0.0',
            description: 'A professional API for managing insurance customers and policies',
            contact: {
                name: 'API Support',
                email: 'support@insureos.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:4000/api',
                description: 'Local Development Server',
            },
        ],
        components: {
            schemas: {
                Customer: {
                    type: 'object',
                    required: ['name', 'email', 'city'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        name: { type: 'string' },
                        email: { type: 'string', format: 'email' },
                        phone: { type: 'string' },
                        city: { type: 'string' },
                    },
                },
                Policy: {
                    type: 'object',
                    required: ['customerId', 'policyType', 'premiumAmount', 'startDate', 'endDate'],
                    properties: {
                        id: { type: 'string', format: 'uuid' },
                        policyType: { type: 'string' },
                        premiumAmount: { type: 'number' },
                        status: { type: 'string', enum: ['active', 'expired'] },
                    },
                },
            },
        },
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
};

const specs = swaggerJsdoc(options);
module.exports = specs;
