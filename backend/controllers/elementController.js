// backend/controllers/elementController.js
const Element = require('../models/Element');
const Project = require('../models/Project');

// Crear un nuevo elemento
exports.createElement = async (req, res) => {
  try {
    const { projectId, type, name, content, position, size, styles, parentId } = req.body;
    
    // Verificar si el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario tiene acceso al proyecto
    if (!project.owner.equals(req.userId) && !project.collaborators.some(collab => collab.equals(req.userId))) {
      return res.status(403).json({ message: 'No tienes permiso para editar este proyecto' });
    }
    
    // Crear el nuevo elemento
    const element = new Element({
      projectId,
      type,
      name,
      content: content || '',
      position: position || { x: 0, y: 0 },
      size: size || { width: 100, height: 100 },
      styles: styles || {},
      parentId: parentId || null
    });
    
    await element.save();
    
    // Si el elemento tiene un padre, añadirlo como hijo
    if (parentId) {
      await Element.findByIdAndUpdate(parentId, {
        $push: { children: element._id }
      });
    } else {
      // Si no tiene padre, añadirlo directamente al proyecto
      await Project.findByIdAndUpdate(projectId, {
        $push: { elements: element._id }
      });
    }
    
    res.status(201).json({
      message: 'Elemento creado con éxito',
      element
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear el elemento', error: error.message });
  }
};

// Obtener todos los elementos de un proyecto
exports.getElements = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verificar si el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario tiene acceso al proyecto
    if (!project.owner.equals(req.userId) && !project.collaborators.some(collab => collab.equals(req.userId))) {
      return res.status(403).json({ message: 'No tienes permiso para ver este proyecto' });
    }
    
    const elements = await Element.find({ projectId });
    
    res.status(200).json(elements);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener elementos', error: error.message });
  }
};

// Actualizar un elemento
exports.updateElement = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, content, position, size, styles, parentId } = req.body;
    
    const element = await Element.findById(id);
    if (!element) {
      return res.status(404).json({ message: 'Elemento no encontrado' });
    }
    
    // Verificar si el usuario tiene acceso al proyecto
    const project = await Project.findById(element.projectId);
    if (!project.owner.equals(req.userId) && !project.collaborators.some(collab => collab.equals(req.userId))) {
      return res.status(403).json({ message: 'No tienes permiso para editar este elemento' });
    }
    
    // Si se cambia el padre, actualizar relaciones
    if (parentId && parentId !== element.parentId?.toString()) {
      // Eliminar del padre anterior
      if (element.parentId) {
        await Element.findByIdAndUpdate(element.parentId, {
          $pull: { children: element._id }
        });
      } else {
        await Project.findByIdAndUpdate(element.projectId, {
          $pull: { elements: element._id }
        });
      }
      
      // Añadir al nuevo padre
      await Element.findByIdAndUpdate(parentId, {
        $push: { children: element._id }
      });
    }
    
    // Actualizar elemento
    element.name = name || element.name;
    element.content = content !== undefined ? content : element.content;
    element.position = position || element.position;
    element.size = size || element.size;
    element.styles = styles || element.styles;
    element.parentId = parentId || element.parentId;
    element.updatedAt = Date.now();
    
    await element.save();
    
    res.status(200).json({
      message: 'Elemento actualizado con éxito',
      element
    });
  } catch (error) {
    res.status(500).json({ message: 'Error al actualizar el elemento', error: error.message });
  }
};

// Eliminar un elemento
exports.deleteElement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const element = await Element.findById(id);
    if (!element) {
      return res.status(404).json({ message: 'Elemento no encontrado' });
    }
    
    // Verificar si el usuario tiene acceso al proyecto
    const project = await Project.findById(element.projectId);
    if (!project.owner.equals(req.userId) && !project.collaborators.some(collab => collab.equals(req.userId))) {
      return res.status(403).json({ message: 'No tienes permiso para eliminar este elemento' });
    }
    
    // Eliminar elemento del padre
    if (element.parentId) {
      await Element.findByIdAndUpdate(element.parentId, {
        $pull: { children: element._id }
      });
    } else {
      await Project.findByIdAndUpdate(element.projectId, {
        $pull: { elements: element._id }
      });
    }
    
    // Eliminar hijos recursivamente
    const deleteChildrenRecursively = async (childrenIds) => {
      for (const childId of childrenIds) {
        const child = await Element.findById(childId);
        if (child && child.children.length > 0) {
          await deleteChildrenRecursively(child.children);
        }
        await Element.findByIdAndDelete(childId);
      }
    };
    
    if (element.children.length > 0) {
      await deleteChildrenRecursively(element.children);
    }
    
    // Eliminar el elemento
    await Element.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Elemento eliminado con éxito' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el elemento', error: error.message });
  }
};

// Exportar diseño a código Angular
// backend/controllers/elementController.js

// Exportar diseño a código Angular
// Exportar diseño a código Angular
exports.exportToAngular = async (req, res) => {
  try {
    const { projectId } = req.params;
    
    // Verificar si el proyecto existe
    const project = await Project.findById(projectId);
    if (!project) {
      return res.status(404).json({ message: 'Proyecto no encontrado' });
    }
    
    // Verificar si el usuario tiene acceso al proyecto
    if (!project.owner.equals(req.userId) && !project.collaborators.some(collab => collab.equals(req.userId))) {
      return res.status(403).json({ message: 'No tienes permiso para exportar este proyecto' });
    }
    
    // Obtener todos los elementos del proyecto
    const elements = await Element.find({ projectId }).sort({ createdAt: 1 });
    
    // Función recursiva para construir la jerarquía de elementos
    const buildElementTree = (parentId = null) => {
      return elements
        .filter(element => 
          parentId === null 
            ? element.parentId === null 
            : element.parentId && element.parentId.toString() === parentId.toString()
        )
        .map(element => ({
          ...element.toObject(),
          children: buildElementTree(element._id)
        }));
    };
    
    const elementTree = buildElementTree();
    
    // Generar componente Angular
    const generateAngularComponent = (projectName, elements) => {
      const componentName = projectName.toLowerCase().replace(/\s+/g, '-');


        // Función para obtener ID para un nombre, o generar uno nuevo si no existe
        const createIdGenerator = () => {
          const counts = {};
          const idMappings = {}; // Almacena mapeos de nombre -> id generado
          
          return {
            // Generar ID único para cada elemento
            generateId: (name) => {
              // Si ya hemos generado un ID para este nombre, reutilizarlo
              if (idMappings[name]) {
                return idMappings[name];
              }
              
              // Limpiar el nombre para compatibilidad con Angular
              const baseId = name.toLowerCase()
                .replace(/[\s-]+/g, '_')
                .replace(/[^\w_]/g, '')
                .replace(/\(|\)|\s|copia/g, '');
              
              if (!baseId) return 'elemento'; // Por si acaso queda vacío
              
              if (!counts[baseId]) {
                counts[baseId] = 1;
                const newId = baseId;
                idMappings[name] = newId; // Guardar mapeo
                return newId;
              }
              
              counts[baseId]++;
              const newId = `${baseId}${counts[baseId]}`;
              idMappings[name] = newId; // Guardar mapeo
              return newId;
            },
            // Obtener ID ya generado sin crear uno nuevo
            getId: (name) => {
              return idMappings[name] || null;
            }
          };
        };
      
        const idGeneratorUtils = createIdGenerator();
        // Generar HTML
      const generateHTML = (elements, depth = 0) => {
        const indent = ' '.repeat(depth * 2);
        
        return elements.map(element => {
          const { type, name, content, children } = element;
          console.log("name HTML",name)

          const elementId = idGeneratorUtils.generateId(name);
          console.log("ELEMT ",elementId)
          
          // Generar clases CSS
          const className = `element-${elementId}`;
          let tagName = 'div';
          let attributes = `class="${className}"`;
          
          // Determinar tipo de elemento HTML
          switch (type) {
            case 'text':
              tagName = 'p';
              break;
            case 'button':
              tagName = 'button';
              attributes += ` (click)="onButtonClick('${elementId}')"`;
              break;
            case 'image':
              tagName = 'img';
              attributes += ` src="${content || 'assets/placeholder.jpg'}" alt="${name}"`;
              break;
            case 'input':
              tagName = 'input';
              attributes += ` type="text" placeholder="${content || ''}" [formControl]="formControls.${elementId}"`;
              break;
            case 'textarea':
              tagName = 'textarea';
              attributes += ` placeholder="${content || ''}" [formControl]="formControls.${elementId}"`;
              break;
            case 'checkbox':
              tagName = 'div';
              attributes = `class="form-check ${className}"`;
              break;
            case 'radio':
              tagName = 'div';
              attributes = `class="form-check ${className}"`;
              break;
            case 'select':
              tagName = 'select';
              attributes += ` class="form-select ${className}" [formControl]="formControls.${elementId}"`;
              break;
            case 'navbar':
              tagName = 'nav';
              attributes = `class="navbar navbar-expand-lg navbar-light ${className}"`;
              break;
            case 'link':
              tagName = 'a';
              attributes += ` href="#" class="${className}"`;
              break;
            case 'menu':
              tagName = 'div';
              attributes = `class="menu ${className}"`;
              break;
            case 'menuItem':
              tagName = 'div';
              attributes = `class="menu-item ${className}"`;
              break;
            case 'card':
              tagName = 'div';
              attributes = `class="card ${className}"`;
              break;
            case 'hero':
              tagName = 'div';
              attributes = `class="hero-section ${className}"`;
              break;
            case 'footer':
              tagName = 'footer';
              attributes = `class="${className}"`;
              break;
            case 'carousel':
              tagName = 'div';
              attributes = `class="carousel ${className}"`;
              break;
            case 'video':
              tagName = 'div';
              attributes = `class="video-container ${className}"`;
              break;
            case 'avatar':
              tagName = 'div';
              attributes = `class="avatar ${className}"`;
              break;
            case 'alert':
              tagName = 'div';
              attributes = `class="alert ${className}"`;
              break;
            case 'badge':
              tagName = 'span';
              attributes = `class="badge ${className}"`;
              break;
            case 'tooltip':
              tagName = 'div';
              attributes = `class="tooltip ${className}"`;
              break;
            case 'progress':
              tagName = 'div';
              attributes = `class="progress ${className}"`;
              break;
            case 'container':
            default:
              attributes = `class="container ${className}"`;
              break;
          }
          
          // Generar contenido interno según tipo
          let innerContent = '';
          
          if (children && children.length) {
            // Si tiene hijos, renderizarlos recursivamente
            innerContent = '\n' + generateHTML(children, depth + 1) + '\n' + indent;
          } else {
            // Generar contenido específico para cada tipo
            switch (type) {
              case 'checkbox':
                innerContent = `
${indent}  <input type="checkbox" class="form-check-input" id="${elementId}" [formControl]="formControls.${elementId}">
${indent}  <label class="form-check-label" for="${elementId}">${content || 'Opción'}</label>`;
                break;
              case 'radio':
                innerContent = `
${indent}  <input type="radio" class="form-check-input" id="${elementId}" name="radioGroup" value="${elementId}" [formControl]="formControls.radioGroup">
${indent}  <label class="form-check-label" for="${elementId}">${content || 'Opción'}</label>`;
                break;
              case 'card':
                innerContent = `
${indent}  <div class="card-body">
${indent}    <h5 class="card-title">${content || 'Título de tarjeta'}</h5>
${indent}    <p class="card-text">Contenido de ejemplo para esta tarjeta.</p>
${indent}  </div>`;
                break;
              case 'navbar':
                innerContent = `
${indent}  <div class="container-fluid">
${indent}    <a class="navbar-brand" href="#">${content || 'Logo'}</a>
${indent}    <button class="navbar-toggler" type="button">
${indent}      <span class="navbar-toggler-icon"></span>
${indent}    </button>
${indent}    <div class="collapse navbar-collapse">
${indent}      <ul class="navbar-nav">
${indent}        <li class="nav-item"><a class="nav-link active" href="#">Inicio</a></li>
${indent}        <li class="nav-item"><a class="nav-link" href="#">Características</a></li>
${indent}        <li class="nav-item"><a class="nav-link" href="#">Precios</a></li>
${indent}      </ul>
${indent}    </div>
${indent}  </div>`;
                break;
              case 'hero':
                innerContent = `
${indent}  <div class="hero-content">
${indent}    <h1>${content || 'Título Principal'}</h1>
${indent}    <p>Subtítulo o descripción para esta sección hero.</p>
${indent}    <button class="btn btn-primary">Acción Principal</button>
${indent}  </div>`;
                break;
              case 'footer':
                innerContent = `
${indent}  <div class="container">
${indent}    <div class="row">
${indent}      <div class="col-md-4">
${indent}        <h5>Sección 1</h5>
${indent}        <ul class="list-unstyled">
${indent}          <li><a href="#">Enlace 1</a></li>
${indent}          <li><a href="#">Enlace 2</a></li>
${indent}        </ul>
${indent}      </div>
${indent}      <div class="col-md-4">
${indent}        <h5>Sección 2</h5>
${indent}        <p>Información de contacto</p>
${indent}      </div>
${indent}      <div class="col-md-4">
${indent}        <h5>Redes Sociales</h5>
${indent}        <div class="social-links">
${indent}          <a href="#"><i class="fa fa-facebook"></i></a>
${indent}          <a href="#"><i class="fa fa-twitter"></i></a>
${indent}        </div>
${indent}      </div>
${indent}    </div>
${indent}    <div class="row mt-3">
${indent}      <div class="col-12 text-center">
${indent}        <p>&copy; 2025 ${projectName}. Todos los derechos reservados.</p>
${indent}      </div>
${indent}    </div>
${indent}  </div>`;
                break;
              case 'video':
                innerContent = `
${indent}  <div class="video-placeholder">
${indent}    <i class="fa fa-play-circle"></i>
${indent}    <span>${content || 'Video'}</span>
${indent}  </div>`;
                break;
              case 'avatar':
                innerContent = `${content?.charAt(0) || 'U'}`;
                break;
              case 'alert':
                innerContent = `
${indent}  <i class="fa fa-exclamation-circle"></i>
${indent}  <span>${content || 'Mensaje de alerta'}</span>`;
                break;
              case 'progress':
                innerContent = `
${indent}  <div class="progress-bar" style="width: 50%"></div>`;
                break;
              case 'select':
                innerContent = `
${indent}  <option value="">Seleccione una opción</option>
${indent}  <option value="opcion1">Opción 1</option>
${indent}  <option value="opcion2">Opción 2</option>
${indent}  <option value="opcion3">Opción 3</option>`;
                break;
              default:
                innerContent = content || '';
                break;
            }
          }
          
          // Si es un elemento vacío como img o input
          if (['img', 'input'].includes(tagName)) {
            return `${indent}<${tagName} ${attributes}>`;
          }
          
          return `${indent}<${tagName} ${attributes}>${innerContent}</${tagName}>`;
        }).join('\n');
      };
      
      // Generar CSS con posicionamiento absoluto para mantener posiciones exactas
      const generateCSS = (elements) => {
        let css = `/* Estilos para ${componentName} */\n\n`;
        
        // Estilos del contenedor principal
        css += `:host {\n  display: block;\n  position: relative;\n  width: 100%;\n  max-width: ${project.canvas.width}px;\n  height: ${project.canvas.height}px;\n  margin: 0 auto;\n  background-color: ${project.canvas.background || '#FFFFFF'};\n}\n\n`;
        
        // Procesar elementos para generar CSS
        const processElement = (element) => {
          const { name, type, position, size, styles = {} } = element;
          console.log("name CSS",name)

          const elementId = idGeneratorUtils.getId(name);
          const className = `.element-${elementId}`;
          
          let elementCSS = `/* Elemento: "${name}" (${type}) */\n`;
          elementCSS += `${className} {\n`;
          
          // Posicionamiento absoluto para mantener las posiciones exactas
          elementCSS += `  position: absolute;\n`;
          elementCSS += `  left: ${position.x}px;\n`;
          elementCSS += `  top: ${position.y}px;\n`;
          elementCSS += `  width: ${size.width}px;\n`;
          elementCSS += `  height: ${size.height}px;\n`;
          
          // Añadir los estilos personalizados del elemento
          for (const [key, value] of Object.entries(styles)) {
            if (value !== undefined && value !== null && value !== '' && value !== 'none' && value !== 'transparent') {
              // Convertir camelCase a kebab-case
              const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
              elementCSS += `  ${cssKey}: ${value};\n`;
            }
          }
          
          // Añadir estilos adicionales según el tipo
          switch (type) {
            case 'text':
              elementCSS += `  overflow: hidden;\n`;
              if (!styles.textAlign) elementCSS += `  text-align: center;\n`;
              if (!styles.display) elementCSS += `  display: flex;\n`;
              if (!styles.alignItems) elementCSS += `  align-items: center;\n`;
              if (!styles.justifyContent) elementCSS += `  justify-content: center;\n`;
              break;
            case 'button':
              elementCSS += `  cursor: pointer;\n`;
              elementCSS += `  border: none;\n`;
              if (!styles.display) elementCSS += `  display: flex;\n`;
              if (!styles.alignItems) elementCSS += `  align-items: center;\n`;
              if (!styles.justifyContent) elementCSS += `  justify-content: center;\n`;
              break;
            case 'input':
            case 'textarea':
              elementCSS += `  padding: 8px;\n`;
              elementCSS += `  box-sizing: border-box;\n`;
              if (!styles.borderWidth) elementCSS += `  border: 1px solid #ddd;\n`;
              if (!styles.borderRadius) elementCSS += `  border-radius: 4px;\n`;
              break;
            case 'checkbox':
            case 'radio':
              elementCSS += `  display: flex;\n`;
              elementCSS += `  align-items: center;\n`;
              break;
            case 'container':
              elementCSS += `  overflow: visible;\n`;
              break;
            case 'image':
              elementCSS += `  object-fit: contain;\n`;
              elementCSS += `  max-width: 100%;\n`;
              break;
            case 'navbar':
              elementCSS += `  padding: 0.5rem 1rem;\n`;
              break;
            case 'card':
              elementCSS += `  border-radius: 4px;\n`;
              elementCSS += `  overflow: hidden;\n`;
              if (!styles.boxShadow) elementCSS += `  box-shadow: 0 2px 5px rgba(0,0,0,0.1);\n`;
              elementCSS += `  display: flex;\n`;
              elementCSS += `  flex-direction: column;\n`;
              break;
            case 'hero':
              elementCSS += `  display: flex;\n`;
              elementCSS += `  align-items: center;\n`;
              elementCSS += `  justify-content: center;\n`;
              elementCSS += `  flex-direction: column;\n`;
              elementCSS += `  text-align: center;\n`;
              break;
            case 'footer':
              elementCSS += `  padding: 2rem 0;\n`;
              if (!styles.backgroundColor) elementCSS += `  background-color: #333;\n`;
              if (!styles.color) elementCSS += `  color: white;\n`;
              break;
            case 'avatar':
              elementCSS += `  display: flex;\n`;
              elementCSS += `  align-items: center;\n`;
              elementCSS += `  justify-content: center;\n`;
              elementCSS += `  border-radius: 50%;\n`;
              if (!styles.backgroundColor) elementCSS += `  background-color: #4285f4;\n`;
              if (!styles.color) elementCSS += `  color: white;\n`;
              elementCSS += `  font-weight: bold;\n`;
              break;
            case 'alert':
              elementCSS += `  display: flex;\n`;
              elementCSS += `  align-items: center;\n`;
              elementCSS += `  padding: 1rem;\n`;
              elementCSS += `  border-radius: 4px;\n`;
              if (!styles.backgroundColor) elementCSS += `  background-color: #f8d7da;\n`;
              if (!styles.color) elementCSS += `  color: #721c24;\n`;
              elementCSS += `  gap: 10px;\n`;
              break;
            case 'badge':
              elementCSS += `  display: inline-flex;\n`;
              elementCSS += `  align-items: center;\n`;
              elementCSS += `  justify-content: center;\n`;
              elementCSS += `  padding: 0.25em 0.5em;\n`;
              elementCSS += `  border-radius: 10px;\n`;
              if (!styles.backgroundColor) elementCSS += `  background-color: #4285f4;\n`;
              if (!styles.color) elementCSS += `  color: white;\n`;
              elementCSS += `  font-size: 0.75em;\n`;
              break;
            case 'progress':
              elementCSS += `  display: flex;\n`;
              elementCSS += `  align-items: center;\n`;
              if (!styles.backgroundColor) elementCSS += `  background-color: #e9ecef;\n`;
              elementCSS += `  border-radius: 4px;\n`;
              elementCSS += `  overflow: hidden;\n`;
              break;
            case 'tooltip':
              elementCSS += `  display: flex;\n`;
              elementCSS += `  align-items: center;\n`;
              elementCSS += `  justify-content: center;\n`;
              elementCSS += `  padding: 0.5rem;\n`;
              elementCSS += `  border-radius: 4px;\n`;
              if (!styles.backgroundColor) elementCSS += `  background-color: #333;\n`;
              if (!styles.color) elementCSS += `  color: white;\n`;
              elementCSS += `  font-size: 0.8em;\n`;
              break;
          }
          
          elementCSS += `}\n\n`;
          
          // Estilos para subcomponentes específicos
          switch (type) {
            case 'progress':
              elementCSS += `${className} .progress-bar {\n`;
              elementCSS += `  height: 100%;\n`;
              elementCSS += `  background-color: #4285f4;\n`;
              elementCSS += `}\n\n`;
              break;
            case 'card':
              elementCSS += `${className} .card-body {\n`;
              elementCSS += `  padding: 1rem;\n`;
              elementCSS += `  flex: 1;\n`;
              elementCSS += `}\n\n`;
              elementCSS += `${className} .card-title {\n`;
              elementCSS += `  margin-top: 0;\n`;
              elementCSS += `  margin-bottom: 0.5rem;\n`;
              elementCSS += `  font-size: 1.25rem;\n`;
              elementCSS += `}\n\n`;
              break;
            case 'video':
              elementCSS += `${className} .video-placeholder {\n`;
              elementCSS += `  width: 100%;\n`;
              elementCSS += `  height: 100%;\n`;
              elementCSS += `  display: flex;\n`;
              elementCSS += `  flex-direction: column;\n`;
              elementCSS += `  align-items: center;\n`;
              elementCSS += `  justify-content: center;\n`;
              elementCSS += `  background-color: #000;\n`;
              elementCSS += `  color: white;\n`;
              elementCSS += `}\n\n`;
              elementCSS += `${className} .fa-play-circle {\n`;
              elementCSS += `  font-size: 3rem;\n`;
              elementCSS += `  margin-bottom: 1rem;\n`;
              elementCSS += `}\n\n`;
              break;
          }
          
          // Añadir reglas responsivas
          elementCSS += `@media screen and (max-width: 768px) {\n`;
          elementCSS += `  ${className} {\n`;
          elementCSS += `    /* Mantener posicionamiento absoluto pero escalar proporcionalmente */\n`;
          elementCSS += `    transform-origin: top left;\n`;
          elementCSS += `    transform: scale(var(--responsive-scale, 1));\n`;
          elementCSS += `  }\n`;
          elementCSS += `}\n\n`;
          
          return elementCSS;
        };
        
        // Procesar todos los elementos recursivamente
        const processAllElements = (elements) => {
          return elements.map(element => {
            let result = processElement(element);
            
            // Procesar hijos recursivamente
            if (element.children && element.children.length) {
              result += processAllElements(element.children);
            }
            
            return result;
          }).join('');
        };
        
        css += processAllElements(elements);
        
        // Añadir código JavaScript para ajustar escala responsiva
        css += `/* Script para ajustar escala responsiva */\n`;
        css += `:host ::ng-deep script.responsive-script {\n`;
        css += `  display: none;\n`;
        css += `}\n\n`;
        
        return css;
      };
      
      // Función para TypeScript con formData
      const generateTS = (componentName, elements) => {
        const className = componentName.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
        
        // Recolectar todos los IDs de campos de formulario
        const formFields = [];
        
        // Función recursiva para encontrar todos los campos de formulario
        const findFormFields = (elements) => {
          elements.forEach(element => {
            if (['input', 'textarea', 'select', 'checkbox', 'radio'].includes(element.type)) {
              const elementId = idGeneratorUtils.getId(element.name);
              formFields.push({
                id: elementId,
                type: element.type
              });
            }
            
            // Buscar en elementos hijos
            if (element.children && element.children.length > 0) {
              findFormFields(element.children);
            }
          });
        };
        
        // Buscar campos de formulario
        findFormFields(elements);
        
        // Generar código de inicialización de formControls
        let formControlsInit = '';
        if (formFields.length > 0) {
          formControlsInit = `    this.formControls = {\n`;
          
          formFields.forEach((field, index) => {
            // Determinar el valor inicial según el tipo
            let initialValue = "''";
            if (field.type === 'checkbox') initialValue = 'false';
            if (field.type === 'radio' && field.id === 'radioGroup') initialValue = 'null';
            
            formControlsInit += `      ${field.id}: new FormControl(${initialValue})${index < formFields.length - 1 ? ',' : ''}\n`;
          });
          
          // Agregar grupo de radio si es necesario
          if (formFields.some(f => f.type === 'radio')) {
            formControlsInit += `,      radioGroup: new FormControl('')\n`;
          }
          
          formControlsInit += `    };\n`;
          
          // Agregar FormGroup si hay campos
          formControlsInit += `    this.form = new FormGroup(this.formControls);\n`;
        } else {
          formControlsInit = '    // No hay campos de formulario que inicializar\n';
        }
        
        // Crear código de componente
        let tsCode = `import { Component, OnInit, AfterViewInit, ElementRef, Renderer2 } from '@angular/core';\n`;
        tsCode += `import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';\n\n`;
        
        tsCode += `@Component({\n`;
        tsCode += `  selector: 'app-${componentName}',\n`;
        tsCode += `  templateUrl: './${componentName}.component.html',\n`;
        tsCode += `  styleUrls: ['./${componentName}.component.css'],\n`;
        tsCode += `  standalone: true,\n`;
        tsCode += `  imports: [ReactiveFormsModule]\n`;
        tsCode += `})\n`;
        tsCode += `export class ${className}Component implements OnInit, AfterViewInit {\n`;
        
        // Añadir propiedades
        if (formFields.length > 0) {
          tsCode += `  // Formulario reactivo\n`;
          tsCode += `  form!: FormGroup;\n`;
          tsCode += `  formControls: { [key: string]: FormControl } = {};\n\n`;
        }
        
        // Constructor
        tsCode += `  constructor(private el: ElementRef, private renderer: Renderer2) { }\n\n`;
        
        // Métodos de ciclo de vida
        tsCode += `  ngOnInit(): void {\n`;
        tsCode += formControlsInit;
        tsCode += `  }\n\n`;
        
        // Después de la vista inicializada, añadir script para responsividad
        tsCode += `  ngAfterViewInit(): void {\n`;
        tsCode += `    // Añadir script para ajuste responsivo\n`;
        tsCode += `    const script = this.renderer.createElement('script');\n`;
        tsCode += `    this.renderer.addClass(script, 'responsive-script');\n`;
        tsCode += `    const scriptContent = this.renderer.createText(\`\n`;
        tsCode += `      function adjustScale() {\n`;
        tsCode += `        const container = document.querySelector('app-${componentName}');\n`;
        tsCode += `        if (container) {\n`;
        tsCode += `          const containerWidth = container.clientWidth;\n`;
        tsCode += `          const designWidth = ${project.canvas.width};\n`;
        tsCode += `          if (containerWidth < designWidth) {\n`;
        tsCode += `            const scale = containerWidth / designWidth;\n`;
        tsCode += `            container.style.setProperty('--responsive-scale', scale.toString());\n`;
        tsCode += `            container.style.height = (${project.canvas.height} * scale) + 'px';\n`;
        tsCode += `          } else {\n`;
        tsCode += `            container.style.setProperty('--responsive-scale', '1');\n`;
        tsCode += `            container.style.height = '${project.canvas.height}px';\n`;
        tsCode += `          }\n`;
        tsCode += `        }\n`;
        tsCode += `      }\n`;
        tsCode += `      window.addEventListener('resize', adjustScale);\n`;
        tsCode += `      adjustScale();\n`;
        tsCode += `    \`);\n`;
        tsCode += `    this.renderer.appendChild(script, scriptContent);\n`;
        tsCode += `    this.renderer.appendChild(this.el.nativeElement, script);\n`;
        tsCode += `  }\n\n`;
        
        // Método para manejar clics en botones
        tsCode += `  onButtonClick(elementId: string): void {\n`;
        tsCode += `    console.log('Botón clickeado:', elementId);\n`;
        tsCode += `    // Implementar lógica específica aquí\n`;
        tsCode += `  }\n`;
        
        // Cerrar clase
        tsCode += `}\n`;
        
        return tsCode;
      };
      
      // Generar módulo Angular
      const generateModule = (componentName) => {
        const className = componentName.split('-').map(word => 
          word.charAt(0).toUpperCase() + word.slice(1)
        ).join('');
        
        return `import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { ${className}Component } from './${componentName}.component';

@NgModule({
  declarations: [],
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ${className}Component
  ],
  exports: [
    ${className}Component
  ]
})
export class ${className}Module { }`;
      };
      const html = generateHTML(elements, 0);
      const css = generateCSS(elements);
      const ts = generateTS(componentName, elements);
      
      return {
        html,
        css,
        ts,
        module: generateModule(componentName)
      };
    };
    
    const angularComponent = generateAngularComponent(project.name, elementTree);
    
    res.status(200).json({
      message: 'Código exportado con éxito',
      component: angularComponent
    });
  } catch (error) {
    console.error('Error al exportar a Angular:', error);
    res.status(500).json({ message: 'Error al exportar a Angular', error: error.message });
  }
};

// Duplicar un elemento
exports.duplicateElement = async (req, res) => {
  try {
    const { id } = req.params;
    
    const originalElement = await Element.findById(id);
    if (!originalElement) {
      return res.status(404).json({ message: 'Elemento no encontrado' });
    }
    
    // Verificar si el usuario tiene acceso al proyecto
    const project = await Project.findById(originalElement.projectId);
    if (!project.owner.equals(req.userId) && !project.collaborators.some(collab => collab.equals(req.userId))) {
      return res.status(403).json({ message: 'No tienes permiso para duplicar este elemento' });
    }
    
    // Función para duplicar el elemento
    // Crear una copia del elemento sin los campos _id y children
    const { _id, children, createdAt, updatedAt, __v, ...elementData } = originalElement.toObject();
    
    // Modificar ligeramente la posición para que no quede exactamente encima
    const newElement = new Element({
      ...elementData,
      name: `${elementData.name} copia`,
      position: {
        x: elementData.position.x + 20,
        y: elementData.position.y + 20
      }
    });
    
    await newElement.save();
    
    // Si el elemento tiene un padre, añadirlo como hijo
    if (elementData.parentId) {
      await Element.findByIdAndUpdate(elementData.parentId, {
        $push: { children: newElement._id }
      });
    } else {
      // Si no tiene padre, añadirlo al proyecto
      await Project.findByIdAndUpdate(elementData.projectId, {
        $push: { elements: newElement._id }
      });
    }
    
    res.status(201).json({
      message: 'Elemento duplicado con éxito',
      element: newElement
    });
  } catch (error) {
    console.error('Error detallado al duplicar elemento:', error);
    res.status(500).json({ message: 'Error al duplicar el elemento', error: error.message });
  }
};