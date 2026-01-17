const express = require('express');
const { getCustomers, createCustomer } = require('../controllers/customerController');
const { createPolicy, getPoliciesByCustomer, searchPolicies, getDashboardStats } = require('../controllers/policyController');
const { register, login, forgotPassword, resetPassword } = require('../controllers/authController');
const authenticateToken = require('../middleware/authMiddleware');

const router = express.Router();

// Public Routes
router.post('/auth/register', register);
router.post('/auth/login', login);
router.post('/auth/forgot-password', forgotPassword);
router.post('/auth/reset-password', resetPassword);

// Information Routes (Public for now or Protected)
router.post('/loans/calculate', require('../controllers/loanController').calculateLoan);
router.post('/loans/simulate', require('../controllers/loanController').simulatePrepayment);

// Protected Routes
router.use(authenticateToken); // Apply to all subsequent routes

/**
 * @swagger
 * /customers:
 *   get:
 *     summary: Retrieve a list of customers
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A list of customers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Customer'
 */
router.get('/customers', getCustomers);

/**
 * @swagger
 * /customers:
 *   post:
 *     summary: Create a new customer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Customer'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/customers', createCustomer);

/**
 * @swagger
 * /policies:
 *   post:
 *     summary: Create a new policy
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Policy'
 *     responses:
 *       201:
 *         description: Created
 */
router.post('/policies', createPolicy);

router.get('/customers/:customerId/policies', getPoliciesByCustomer);

/**
 * @swagger
 * /policies/search:
 *   get:
 *     summary: Search policies
 *     parameters:
 *       - in: query
 *         name: city
 *         schema:
 *           type: string
 *       - in: query
 *         name: policyType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Search results
 */
router.get('/policies/search', searchPolicies);

router.get('/dashboard/stats', getDashboardStats);

module.exports = router;
