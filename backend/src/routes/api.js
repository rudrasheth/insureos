const express = require('express');
const { getCustomers, createCustomer } = require('../controllers/customerController');
const { createPolicy, getPoliciesByCustomer, searchPolicies } = require('../controllers/policyController');

const router = express.Router();

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

module.exports = router;
