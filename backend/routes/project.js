// backend/routes/project.js
const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const authMiddleware = require('../middleware/authMiddleware');
console.log('Controller cargado:', projectController);

// Todas las rutas de proyectos requieren autenticación
router.use(authMiddleware);

// CRUD para proyectos
router.post('/', projectController.createProject);
router.get('/', projectController.getProjects);
router.get('/:id', projectController.getProject);
router.put('/:id', projectController.updateProject);
router.delete('/:id', projectController.deleteProject);

// Colaboradores
router.get('/:id/collaborators', authMiddleware, projectController.getCollaborators);
router.post('/:id/collaborators', authMiddleware, projectController.addCollaborator);
router.delete('/:id/collaborators/:userId', authMiddleware, projectController.removeCollaborator);

// Usuarios activos
router.get('/:id/active-users', authMiddleware, projectController.getActiveUsers);

module.exports = router;