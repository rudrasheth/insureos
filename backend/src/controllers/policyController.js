const { z } = require('zod');
const policyService = require('../services/policyService');

const policySchema = z.object({
    customerId: z.string().uuid(),
    policyType: z.string().min(1),
    premiumAmount: z.number().positive(),
    startDate: z.string().datetime({ offset: true }).or(z.string()),
    endDate: z.string().datetime({ offset: true }).or(z.string()),
    status: z.enum(['active', 'expired']),
});

const createPolicy = async (req, res, next) => {
    try {
        const data = policySchema.parse(req.body);
        const policy = await policyService.createPolicy(data);
        res.status(201).json(policy);
    } catch (error) {
        next(error);
    }
};

const getPoliciesByCustomer = async (req, res, next) => {
    try {
        const { customerId } = req.params;
        const policies = await policyService.getPoliciesByCustomer(customerId);
        res.json(policies);
    } catch (error) {
        next(error);
    }
};

const searchPolicies = async (req, res, next) => {
    try {
        const { policyType, status, city } = req.query;
        const policies = await policyService.searchPolicies({ policyType, status, city }, req.user);
        res.json(policies);
    } catch (error) {
        next(error);
    }
};

const getDashboardStats = async (req, res, next) => {
    try {
        const stats = await policyService.getDashboardStats(req.user);
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createPolicy,
    getPoliciesByCustomer,
    searchPolicies,
    getDashboardStats
};
