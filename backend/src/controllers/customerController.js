const { z } = require('zod');
const customerService = require('../services/customerService');

const customerSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    phone: z.string().optional(),
    email: z.string().email('Invalid email address'),
    city: z.string().min(1, 'City is required'),
});

const getCustomers = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const result = await customerService.getCustomers(page, limit);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const createCustomer = async (req, res, next) => {
    try {
        const data = customerSchema.parse(req.body);
        const customer = await customerService.createCustomer(data);
        res.status(201).json(customer);
    } catch (error) {
        if (error.message === 'Email already exists') {
            return res.status(409).json({ error: 'Conflict', message: error.message });
        }
        next(error);
    }
};

module.exports = {
    getCustomers,
    createCustomer,
};
