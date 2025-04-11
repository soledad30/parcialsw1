// src/components/dashboard/Dashboard.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import projectService from '../../services/projectService';
import Navbar from '../common/Navbar';
import ProjectCard from '../projects/ProjectCard';
import ProjectForm from '../projects/ProjectForm';
import './Dashboard.css';

const Dashboard = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);


  // estados para unirse a una sala
  const [joinLink, setJoinLink] = useState('');
  const [joinError, setJoinError] = useState('');
  const [joiningProject, setJoiningProject] = useState(false);
  
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await projectService.getProjects();
      setProjects(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Error al cargar los proyectos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProject = async (projectData) => {
    try {
      const data = await projectService.createProject(projectData);
      setProjects([...projects, data.project]);
      setShowCreateForm(false);
    } catch (err) {
      setError(err.message || 'Error al crear el proyecto');
    }
  };

  const handleEditProject = (projectId) => {
    navigate(`/editor/${projectId}`);
  };

  const handleDeleteProject = async (projectId) => {
    try {
      await projectService.deleteProject(projectId);
      setProjects(projects.filter(project => project._id !== projectId));
    } catch (err) {
      setError(err.message || 'Error al eliminar el proyecto');
    }
  };


  // Añadir esta función para manejar la unión a un proyecto
const handleJoinProject = () => {
  try {
    setJoinError('');
    setJoiningProject(true);
    
    // Validar el enlace
    if (!joinLink) {
      setJoinError('Por favor, ingresa un enlace válido');
      setJoiningProject(false);
      return;
    }
    
    // Extraer el ID del proyecto del enlace
    let projectId;
    try {
      // Asumiendo un formato como: http://localhost:3000/editor/64a1b2c3d4e5f6g7h8i9j0k
      const url = new URL(joinLink);
      const pathParts = url.pathname.split('/');
      projectId = pathParts[pathParts.length - 1];
    } catch (error) {
      // Si no es una URL válida, comprobamos si es solo el ID
      if (/^[a-f\d]{24}$/i.test(joinLink)) {
        projectId = joinLink;
      } else {
        setJoinError('El enlace proporcionado no es válido');
        setJoiningProject(false);
        return;
      }
    }
    
    // Navegar al editor con el ID del proyecto
    navigate(`/editor/${projectId}`);
  } catch (error) {
    console.error('Error al unirse al proyecto:', error);
    setJoinError('Error al unirse al proyecto: ' + (error.message || 'Error desconocido'));
    setJoiningProject(false);
  }
};


  return (
    <div className="dashboard-container">
      <Navbar />
      
      <div className="dashboard-content">
        <header className="dashboard-header">
          <h1>Mis Proyectos</h1>
          <button 
            className="create-button"
            onClick={() => setShowCreateForm(true)}
          >
            Crear Proyecto
          </button>
        </header>


        {/* Sección para unirse a un proyecto compartido */}
      <div className="join-project-section">
        <h2>Unirse a un proyecto compartido</h2>
        <div className="join-form">
          <input
            type="text"
            placeholder="Pega aquí el enlace compartido"
            value={joinLink}
            onChange={(e) => setJoinLink(e.target.value)}
            className="join-input"
          />
          <button 
            className="join-button"
            onClick={handleJoinProject}
            disabled={joiningProject}
          >
            {joiningProject ? 'Uniéndose...' : 'Unirse'}
          </button>
        </div>
        {joinError && <div className="join-error">{joinError}</div>}
      </div>
        
        {error && <div className="dashboard-error">{error}</div>}
        
        {showCreateForm && (
          <div className="create-form-container">
            <ProjectForm 
              onSubmit={handleCreateProject}
              onCancel={() => setShowCreateForm(false)}
            />
          </div>
        )}
        
        {loading ? (
          <div className="loading-spinner">Cargando proyectos...</div>
        ) : (
          <div className="projects-grid">
            {projects.length > 0 ? (
              projects.map(project => (
                <ProjectCard
                  key={project._id}
                  project={project}
                  onEdit={() => handleEditProject(project._id)}
                  onDelete={() => handleDeleteProject(project._id)}
                  isOwner={currentUser?.id === project.owner?._id || currentUser?.id === project.owner}
                />
              ))
            ) : (
              <div className="no-projects">
                <p>No tienes proyectos todavía.</p>
                <button onClick={() => setShowCreateForm(true)}>
                  Crear tu primer proyecto
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;