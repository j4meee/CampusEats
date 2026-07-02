const requireRole = (req, res, next) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(403).json({ message: "Access denied. No role provided." });
        }
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ message: "Access denied. Only " + roles.join(", ") + " can perform this action." });
        }
        next();
    }
}