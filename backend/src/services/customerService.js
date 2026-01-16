const Customer = require('../models/Customer');

const getCustomers = async (page = 1, limit = 10, user) => {
    const skip = (page - 1) * limit;

    // RBAC Filter (Modified to show Legacy Data)
    const filter = {};
    if (user.role !== 'admin') {
        filter.$or = [
            { createdBy: user.id },
            { createdBy: { $exists: false } }, // Show old records too
            { createdBy: null }
        ];
    }

    // Fetch total count for pagination
    const total = await Customer.countDocuments(filter);

    // Aggregation to fetch customers AND count their policies
    const rawCustomers = await Customer.aggregate([
        { $match: filter }, // Apply RBAC Filter
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

const createCustomer = async (data, user) => {
    // Check for existing email (globally unique)
    const existing = await Customer.findOne({ email: data.email });
    if (existing) {
        throw new Error('Email already exists');
    }

    return await Customer.create({
        ...data,
        createdBy: user.id
    });
};

module.exports = {
    getCustomers,
    createCustomer,
};
