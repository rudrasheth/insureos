const Policy = require('../models/Policy');
const Customer = require('../models/Customer');

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

    if (city) {
        const customers = await Customer.find({ city: { $regex: city, $options: 'i' } }).select('_id');
        const customerIds = customers.map(c => c._id);

        query.customerId = { $in: customerIds };
    }

    return await Policy.find(query)
        .populate('customerId', 'name email city')
        .sort({ createdAt: -1 });
};

const getDashboardStats = async () => {
    const totalRevenueResult = await Policy.aggregate([
        { $group: { _id: null, total: { $sum: "$premiumAmount" } } }
    ]);
    const totalRevenue = totalRevenueResult[0]?.total || 0;

    const totalClients = await Customer.countDocuments();
    const activePolicies = await Policy.countDocuments({ status: 'active' });
    const pendingClaims = 14; // Mocking this as we don't have Claims model yet

    // Simple Monthly Revenue Aggregation (Last 6 Months)
    const monthlyData = await Policy.aggregate([
        {
            $group: {
                _id: { $month: "$startDate" },
                value: { $sum: "$premiumAmount" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    // Map numerical months to names
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const chartData = monthlyData.map(item => ({
        name: monthNames[item._id - 1],
        value: item.value
    }));

    return {
        revenue: totalRevenue,
        activeClients,
        activePolicies,
        pendingClaims,
        chartData
    };
};

module.exports = {
    createPolicy,
    getPoliciesByCustomer,
    searchPolicies,
    getDashboardStats
};
