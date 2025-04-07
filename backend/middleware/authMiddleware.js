// backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  try {
    // Obtener token del encabezado
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ message: 'Acceso denegado. No se proporcionó token' });
    }
    
    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret_key');
    
    // Añadir el ID del usuario al objeto de solicitud
    req.userId = decoded.id;
    
    next();
  } catch (error) {
    res.status(401).json({ message: 'Token inválido' });
  }
};