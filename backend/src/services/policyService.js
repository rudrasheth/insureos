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

const searchPolicies = async (filters, user) => {
    const { policyType, status, city } = filters;
    const query = {};

    // RBAC: Identify Allowed Customers first
    let rbacQuery = {};
    if (user && user.role !== 'admin') {
        rbacQuery.createdBy = user.id;
    }

    if (city) {
        rbacQuery.city = { $regex: city, $options: 'i' };
    }

    // if RBAC or City filter exists, we need to find customers first
    if (Object.keys(rbacQuery).length > 0) {
        const customers = await Customer.find(rbacQuery).select('_id');
        const customerIds = customers.map(c => c._id);

        // If searching a specific city/user yields no customers, return empty instantly
        if (customerIds.length === 0) return [];

        query.customerId = { $in: customerIds };
    }

    if (policyType) {
        query.policyType = { $regex: policyType, $options: 'i' };
    }
    if (status) {
        query.status = status;
    }

    return await Policy.find(query)
        .populate('customerId', 'name email city')
        .sort({ createdAt: -1 });
};

const getDashboardStats = async (user) => {
    // RBAC Filter
    let customerFilter = {};
    if (user && user.role !== 'admin') {
        customerFilter.createdBy = user.id;
    }

    // 1. Fetch Client Count
    let totalClients = 0;
    try {
        totalClients = await Customer.countDocuments(customerFilter);
    } catch (e) {
        console.error("Failed to count clients:", e);
    }

    // 2. Fetch Policy Stats (Safely)
    let totalRevenue = 0;
    let activePolicies = 0;
    let chartData = [];
    const pendingClaims = 14; // Mock

    try {
        // Resolve allowed Customer IDs for Policy filtering
        let allowedCustomerIds = null;
        if (Object.keys(customerFilter).length > 0) {
            const customers = await Customer.find(customerFilter).select('_id');
            allowedCustomerIds = customers.map(c => c._id);
        }

        const policyQuery = allowedCustomerIds ? { customerId: { $in: allowedCustomerIds } } : {};
        const activePolicyQuery = { ...policyQuery, status: 'active' };

        // Count Active Policies
        activePolicies = await Policy.countDocuments(activePolicyQuery);

        // Calculate Revenue
        const totalRevenueResult = await Policy.aggregate([
            { $match: policyQuery },
            { $group: { _id: null, total: { $sum: "$premiumAmount" } } }
        ]);
        totalRevenue = totalRevenueResult[0]?.total || 0;

        // Calculate Chart Data
        const monthlyData = await Policy.aggregate([
            { $match: policyQuery },
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
