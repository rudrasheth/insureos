const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const policySchema = new mongoose.Schema({
    _id: {
        type: String,
        default: uuidv4
    },
    customerId: {
        type: String,
        ref: 'Customer',
        required: true
    },
    policyType: {
        type: String,
        required: true
    },
    premiumAmount: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Policy', policySchema);
