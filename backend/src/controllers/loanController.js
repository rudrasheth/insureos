const { z } = require('zod');
const loanOptimizerService = require('../services/loanOptimizerService');

const calculateSchema = z.object({
    principal: z.number().positive(),
    rate: z.number().positive(), // Annual Interest Rate
    tenureMonths: z.number().positive()
});

const simulateSchema = z.object({
    principal: z.number().positive(),
    rate: z.number().positive(),
    tenureMonths: z.number().positive(),
    currentEmi: z.number().positive(),
    prepaymentAmount: z.number().min(0),
    prepaymentFrequency: z.enum(['monthly', 'yearly', 'one-time'])
});

const calculateLoan = async (req, res, next) => {
    try {
        const data = calculateSchema.parse(req.body);
        const result = loanOptimizerService.calculateLoanDetails(data);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

const simulatePrepayment = async (req, res, next) => {
    try {
        const data = simulateSchema.parse(req.body);
        const result = loanOptimizerService.simulatePrepayment(data);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    calculateLoan,
    simulatePrepayment
};
