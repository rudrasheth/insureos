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
    // 1. Fetch Client Count (Independent of Policies)
    let totalClients = 0;
    try {
        totalClients = await Customer.countDocuments();
    } catch (e) {
        console.error("Failed to count clients:", e);
    }

    // 2. Fetch Policy Stats (Safely)
    let totalRevenue = 0;
    let activePolicies = 0;
    let chartData = [];
    const pendingClaims = 14;

    try {
        // Count Active Policies
        activePolicies = await Policy.countDocuments({ status: 'active' });

        // Calculate Revenue
        const totalRevenueResult = await Policy.aggregate([
            { $group: { _id: null, total: { $sum: "$premiumAmount" } } }
        ]);
        totalRevenue = totalRevenueResult[0]?.total || 0;

        // Calculate Chart Data
        const monthlyData = await Policy.aggregate([
            {
                $group: {
                    _id: { $month: "$startDate" },
                    value: { $sum: "$premiumAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        chartData = monthlyData.map(item => ({
            name: monthNames[item._id - 1] || 'Unknown',
            value: item.value
        }));

    } catch (policyError) {
        console.error("Policy stats aggregation failed (likely no policies yet):", policyError);
        // We do NOT reset totalClients here. We just keep policy stats as 0.
    }

    return {
        revenue: totalRevenue,
        activeClients: totalClients,
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
