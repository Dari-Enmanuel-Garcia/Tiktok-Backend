const jwt = require("jsonwebtoken")
const userModel = require("../model/users")
const logger = require("../utils/logger")

const { SECRET } = process.env

const verifyToken = async (req, res, next) => {
    try {
        const token = req.cookies.token

        if (!token) {
            return res.status(401).json({ valid: false, message: "Token no entregado" })
        }

        const decoded = await jwt.verify(token, SECRET)
        const user = await userModel.findOne({ email: decoded.email })

        if (!user) {
            return res.status(404).json({ message: "Usuario no encontrado" })
        }

        req.user = user
        next()
    } catch (error) {
        logger.error(`Error al verificar token: ${error.message}`)
        return res.status(401).json({ valid: false, message: "Token invalido o expirado" })
    }
}

module.exports = verifyToken
