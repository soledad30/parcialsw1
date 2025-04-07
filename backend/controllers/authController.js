// backend/controllers/authController.js
const User = require('../models/User');
const jwt = require('jsonwebtoken');

// Registrar un nuevo usuario
exports.register = async (req, res) => {
  try {
    const { username, email, password } = req.body;

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'Usuario o email ya registrado' });
    }

    // Crear nuevo usuario
    const user = new User({ username, email, password });
    await user.save();

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '30d' }
    );

    res.status(201).json({
      message: 'Usuario registrado con éxito',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al registrar usuario', error: error.message });
  }
};

// Iniciar sesión
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Buscar usuario por email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Credenciales inválidas' });
    }

    // Generar token JWT
    const token = jwt.sign(
      { id: user._id },
      process.env.JWT_SECRET || 'secret_key',
      { expiresIn: '30d' }
    );

    res.status(200).json({
      message: 'Inicio de sesión exitoso',
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al iniciar sesión', error: error.message });
  }
};

// Obtener datos del usuario autenticado
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    res.status(200).json(user);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener datos del usuario', error: error.message });
  }
};

// Actualizar datos del usuario
exports.updateUser = async (req, res) => {
  try {
    const { username, email } = req.body;
    
    // Verificar si el email ya está en uso por otro usuario
    if (email) {
      const existingUser = await User.findOne({ email, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'El email ya está en uso' });
      }
    }
    
    // Verificar si el username ya está en uso por otro usuario
    if (username) {
      const existingUser = await User.findOne({ username, _id: { $ne: req.userId } });
      if (existingUser) {
        return res.status(400).json({ message: 'El nombre de usuario ya está en uso' });
      }
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      req.userId,
      { 
        username: username || undefined,
        email: email || undefined
      },
      { new: true, runValidators: true }
    ).select('-password');
    
    if (!updatedUser) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    res.status(200).json({
      message: 'Usuario actualizado con éxito',
      user: updatedUser
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar usuario', error: error.message });
  }
};

// Cambiar contraseña
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Verificar que la nueva contraseña cumple los requisitos
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 6 caracteres' });
    }
    
    // Buscar usuario
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña actual
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña actual es incorrecta' });
    }
    
    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    
    res.status(200).json({ message: 'Contraseña actualizada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al cambiar la contraseña', error: error.message });
  }
};

// Buscar usuarios (para añadir colaboradores)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ message: 'La búsqueda debe tener al menos 3 caracteres' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.userId } // Excluir al usuario actual
    }).select('_id username email');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuarios', error: error.message });
  }
};

// Eliminar cuenta de usuario
exports.deleteAccount = async (req, res) => {
  try {
    const { password } = req.body;
    
    // Buscar usuario
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'La contraseña es incorrecta' });
    }
    
    // Eliminar usuario
    await User.findByIdAndDelete(req.userId);
    
    res.status(200).json({ message: 'Cuenta eliminada con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar cuenta', error: error.message });
  }
};

// Buscar usuarios (para añadir colaboradores)
exports.searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.length < 3) {
      return res.status(400).json({ message: 'La búsqueda debe tener al menos 3 caracteres' });
    }
    
    const users = await User.find({
      $or: [
        { username: { $regex: query, $options: 'i' } },
        { email: { $regex: query, $options: 'i' } }
      ],
      _id: { $ne: req.userId } // Excluir al usuario actual
    }).select('_id username email');
    
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: 'Error al buscar usuarios', error: error.message });
  }
};

