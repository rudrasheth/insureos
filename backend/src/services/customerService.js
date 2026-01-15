const prisma = require('../config/db');

const getAllCustomers = async (page, limit) => {
    const skip = (page - 1) * limit;
    const [customers, total] = await Promise.all([
        prisma.customer.findMany({
            skip,
            take: limit,
            orderBy: { createdAt: 'desc' },
            include: { _count: { select: { policies: true } } }
        }),
        prisma.customer.count(),
    ]);

    return {
        data: customers,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
};

const createCustomer = async (data) => {
    const existing = await prisma.customer.findUnique({ where: { email: data.email } });
    if (existing) {
        throw new Error('Email already exists');
    }
    return prisma.customer.create({ data });
};

module.exports = {
    getAllCustomers,
    createCustomer,
};
