const Customer = require('../models/Customer');

const getCustomers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    // Fetch total count for pagination
    const total = await Customer.countDocuments();

    // Aggregation to fetch customers AND count their policies
    const rawCustomers = await Customer.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'policies',
                localField: '_id',
                foreignField: 'customerId',
                as: 'policies'
            }
        },
        {
            $addFields: {
                policyCount: { $size: "$policies" }
            }
        },
        {
            $project: {
                policies: 0
            }
        }
    ]);

    // Map to ensure 'id' property exists and form structure matches frontend expectation
    const customers = rawCustomers.map(c => ({
        ...c,
        id: c._id.toString(), // Ensure 'id' exists for frontend
        _count: {
            policies: c.policyCount || 0
        }
    }));

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
