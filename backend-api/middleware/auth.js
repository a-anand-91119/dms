const jwt = require("jsonwebtoken")

const verifyToken = (req, res, next) => {
    const token = req.body.token || req.query.token || req.headers["x-access-token"]
    if (!token) {
        return res.send(403).send({status: "Access Forbidden"})
    }
    try {
        req.user = jwt.verify(token, "A_SECURE_KEY")
    } catch (err) {
        return res.send(403).send({status: "Access Forbidden"})
    }
    return next();
}

module.exports = verifyToken;