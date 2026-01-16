const Customer = require('../models/Customer');

const getCustomers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    // Mongoose countDocuments is async
    const total = await Customer.countDocuments();
    const customers = await Customer.find()
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 });

    return {
        data: customers,
        meta: {
            total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(total / limit),
        },
    };
};

const createCustomer = async (data) => {
    // Check for existing email
    const existing = await Customer.findOne({ email: data.email });
    if (existing) {
        throw new Error('Email already exists');
    }

    return await Customer.create(data);
};

module.exports = {
    getCustomers,
    createCustomer,
};
