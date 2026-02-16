const jwt = require('jsonwebtoken');

const authMiddleware = (roles = []) => {
    return (req, res, next) => {
        // بررسی توکن از header Authorization یا x-auth-token
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.startsWith('Bearer ') 
            ? authHeader.substring(7) 
            : req.header('x-auth-token');
        
        if (!token) {
            return res.status(401).json({ 
                success: false,
                msg: 'توکن وجود ندارد' 
            });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'default-secret-key');
            req.user = decoded.user;

            // چک کردن نقش کاربر
            if (roles.length && !roles.includes(req.user.role)) {
                return res.status(403).json({ 
                    success: false,
                    msg: 'دسترسی غیرمجاز' 
                });
            }

            next();
        } catch (err) {
            res.status(401).json({ 
                success: false,
                msg: 'توکن نامعتبر است' 
            });
        }
    };
};

module.exports = authMiddleware;