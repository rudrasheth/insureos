const prisma = require('../config/db');

const createPolicy = async (data) => {
    return prisma.policy.create({
        data: {
            ...data,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
        },
    });
};

const getPoliciesByCustomer = async (customerId) => {
    return prisma.policy.findMany({
        where: { customerId },
        orderBy: { startDate: 'desc' },
    });
};

const searchPolicies = async (filters) => {
    const { policyType, status, city } = filters;
    const where = {};

    if (policyType) where.policyType = { contains: policyType }; // SQLite doesn't support mode: 'insensitive' well without extensions, but standard contains works for basic matching
    if (status) where.status = status;
    if (city) {
        where.customer = {
            city: { contains: city }
        };
    }

    return prisma.policy.findMany({
        where,
        include: {
            customer: {
                select: { name: true, email: true, city: true }
            }
        },
        orderBy: { createdAt: 'desc' }
    });
};

module.exports = {
    createPolicy,
    getPoliciesByCustomer,
    searchPolicies,
};
