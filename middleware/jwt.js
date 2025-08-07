const jwt = require("jsonwebtoken");
const userModel = require("./models/User"); // Assuming userModel is imported from the User schema

const authMiddleware = async (req, res, next) => {
    try {
        // Check for authorization header
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({
                success: false,
                message: "No token provided or invalid format"
            });
        }

        // Extract access token from header
        const token = authHeader.split(" ")[1];

        // Verify access token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Fetch user from database to ensure they exist and are verified
        const user = await userModel.findById(decoded.id);
        if (!user) {
            return res.status(404).json({
                success: false,
                message: "User not found"
            });
        }

        if (!user.isVerified) {
            return res.status(403).json({
                success: false,
                message: "User not verified"
            });
        }

        // Attach user details to request object
        req.user = { 
            id: decoded.id,
            role: decoded.role // Include role from token payload
        };

        next();
    } catch (err) {
        if (err.name === "TokenExpiredError") {
            return res.status(401).json({
                success: false,
                message: "Access token expired"
            });
        }
        return res.status(401).json({
            success: false,
            message: "Invalid access token"
        });
    }
};

module.exports = authMiddleware;