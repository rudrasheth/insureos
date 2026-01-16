const Customer = require('../models/Customer');

const getCustomers = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;

    // Fetch total count for pagination
    const total = await Customer.countDocuments();

    // Aggregation to fetch customers AND count their policies
    const customers = await Customer.aggregate([
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $lookup: {
                from: 'policies', // The collection name in MongoDB (usually lowercase plural of model name)
                localField: '_id', // The customer's _id (which is a String uuid)
                foreignField: 'customerId', // The field in Policy model
                as: 'policies'
            }
        },
        {
            $addFields: {
                // Add a "matches" field or just count the array
                _count: {
                    policies: { $size: "$policies" }
                }
            }
        },
        {
            $project: {
                policies: 0 // Remove the heavy array, keep only the count
            }
        }
    ]);

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
