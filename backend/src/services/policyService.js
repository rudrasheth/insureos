const Policy = require('../models/Policy');

const createPolicy = async (data) => {
    return await Policy.create({
        ...data,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
    });
};

const getPoliciesByCustomer = async (customerId) => {
    return await Policy.find({ customerId })
        .sort({ startDate: -1 });
};

const searchPolicies = async (filters) => {
    const { policyType, status, city } = filters;
    const query = {};

    if (policyType) {
        query.policyType = { $regex: policyType, $options: 'i' };
    }
    if (status) {
        query.status = status;
    }

    // Handling city search with population is trickier in Mongo if we want to filter parent doc by child field.
    // Standard Mongoose population doesn't easily allow filtering the *parent* (Policy) based on the *child* (Customer) field efficiently without aggregation.
    // However, for simplicity here, we can find matching customers first if city is present, then find policies for those customers.

    if (city) {
        // We need to import Customer model here or inject it to avoid circular dependency issues if structured poorly,
        // but models are generally safe to require.
        const Customer = require('../models/Customer');
        const customers = await Customer.find({ city: { $regex: city, $options: 'i' } }).select('_id');
        const customerIds = customers.map(c => c._id);

        query.customerId = { $in: customerIds };
    }

    return await Policy.find(query)
        .populate('customerId', 'name email city') // populate customer details
        .sort({ createdAt: -1 });
};

module.exports = {
    createPolicy,
    getPoliciesByCustomer,
    searchPolicies,
};
