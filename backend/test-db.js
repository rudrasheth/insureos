const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Connecting to DB...');
        const count = await prisma.customer.count();
        console.log('Connection successful. Customer count:', count);

        const customers = await prisma.customer.findMany({
            take: 1
        });
        console.log('Sample customer:', customers);
    } catch (e) {
        console.error('DB Connection Failed:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
