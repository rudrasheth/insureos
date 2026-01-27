const { z } = require('zod');
const { Finance } = require('financejs');
const finance = new Finance();

class LoanOptimizerService {

    /**
     * Calculate details of a loan including Total Interest and EMI
     */
    calculateLoanDetails({ principal, rate, tenureMonths }) {
        // financejs uses monthly rate for some calcs, but standard formula is usually:
        // EMI = [P x R x (1+R)^N]/[(1+R)^N-1]
        // R = annual rate / 12 / 100

        const r = rate / 12 / 100;
        let emi;
        if (r === 0) {
            emi = principal / tenureMonths;
        } else {
            emi = (principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1);
        }

        if (!isFinite(emi) || isNaN(emi)) {
            throw new Error("Invalid calculation input");
        }
        const totalAmount = emi * tenureMonths;
        const totalInterest = totalAmount - principal;

        return {
            emi: Math.round(emi),
            totalInterest: Math.round(totalInterest),
            totalAmount: Math.round(totalAmount)
        };
    }

    /**
     * Simulate Prepayment Strategy
     * Shows how much interest and time is saved by making extra payments
     */
    simulatePrepayment({ principal, rate, tenureMonths, currentEmi, prepaymentAmount, prepaymentFrequency }) {
        let balance = principal;
        let r = rate / 12 / 100;
        let monthsElapsed = 0;
        let totalInterestPaid = 0;

        // Baseline (No Prepayment)
        const baseline = this.calculateLoanDetails({ principal, rate, tenureMonths });

        // Simulation
        while (balance > 0 && monthsElapsed < 1000) { // Safety break
            // Interest for this month
            let interest = balance * r;
            totalInterestPaid += interest;

            // Principal component
            let principalPaid = currentEmi - interest;

            // Add Prepayment if applicable
            if (prepaymentAmount > 0) {
                if (prepaymentFrequency === 'monthly') {
                    principalPaid += prepaymentAmount;
                } else if (prepaymentFrequency === 'yearly' && monthsElapsed % 12 === 0 && monthsElapsed > 0) {
                    principalPaid += prepaymentAmount;
                } else if (prepaymentFrequency === 'one-time' && monthsElapsed === 0) {
                    principalPaid += prepaymentAmount;
                }
            }

            // Reduce Balance
            balance -= principalPaid;
            monthsElapsed++;

            // Handle last month partial payment
            if (balance < 0) {
                // Adjust last payment
                totalInterestPaid += (balance * r); // meaningless here as bal is neg, but logically last step differs
                // For simplicity in this simulation service, we just break
                balance = 0;
            }
        }

        return {
            originalTenure: tenureMonths,
            newTenure: monthsElapsed,
            monthsSaved: tenureMonths - monthsElapsed,
            originalTotalInterest: baseline.totalInterest,
            newTotalInterest: Math.round(totalInterestPaid),
            interestSaved: baseline.totalInterest - Math.round(totalInterestPaid)
        };
    }
}

module.exports = new LoanOptimizerService();
