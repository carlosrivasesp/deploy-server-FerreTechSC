const jwt = require('jsonwebtoken');


module.exports = function auth(req, res, next) {
try {
const hdr = req.header('Authorization') || '';
const token = hdr.startsWith('Bearer ') ? hdr.slice(7) : null;
if (!token) return res.status(401).json({ error: 'Token requerido' });
const decoded = jwt.verify(token, process.env.JWT_SECRET);
req.userId = decoded.id; // de usuarioController: payload { id: usuario._id }
next();
} catch (err) {
return res.status(401).json({ error: 'Token inválido o expirado' });
}
};