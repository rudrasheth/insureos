const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'supersecretkey';

const User = require('../models/User');

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ error: 'Unauthorized', message: 'Token missing' });
    }

    jwt.verify(token, SECRET_KEY, async (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Forbidden', message: 'Invalid or expired token' });
        }

        try {
            // Fetch fresh user data from DB to support immediate role changes
            // Assuming "id" was stored in the token payload
            const user = await User.findById(decoded.id || decoded._id);

            if (!user) {
                return res.status(401).json({ error: 'Unauthorized', message: 'User not found' });
            }

            // Normalize req.user with fresh data
            req.user = {
                id: user._id.toString(),
                role: user.role,
                email: user.email,
                name: user.name
            };
            next();
        } catch (dbError) {
            console.error("Auth Middleware DB Error:", dbError);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
};

module.exports = authenticateToken;
