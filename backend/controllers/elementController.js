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
    
    // Generar HTML, CSS y TS para Angular
    const generateAngularComponent = (projectName, elements) => {
      const componentName = projectName.toLowerCase().replace(/\s+/g, '-');
      
      // Generar HTML
      const generateHTML = (elements, depth = 0) => {
        const indent = ' '.repeat(depth * 2);
        
        return elements.map(element => {
          const { type, name, content, styles, children } = element;
          
          let tagName = 'div';
          let attributes = `class="${name.toLowerCase().replace(/\s+/g, '-')}"`;
          
          switch (type) {
            case 'text':
              tagName = 'p';
              break;
            case 'button':
              tagName = 'button';
              break;
            case 'image':
              tagName = 'img';
              attributes += ` src="${content || 'assets/placeholder.jpg'}" alt="${name}"`;
              break;
            case 'input':
              tagName = 'input';
              attributes += ` type="text" placeholder="${content || ''}"`;
              break;
            case 'checkbox':
              tagName = 'input';
              attributes += ` type="checkbox"`;
              break;
            case 'radio':
              tagName = 'input';
              attributes += ` type="radio"`;
              break;
            case 'select':
              tagName = 'select';
              break;
            case 'icon':
              tagName = 'i';
              attributes += ` class="fa ${content || 'fa-star'}"`;
              break;
          }
          
          const childrenHTML = children && children.length 
            ? '\n' + generateHTML(children, depth + 1) + '\n' + indent 
            : (type === 'container' ? '' : content || '');
          
          // Si es un elemento vacío como input o img
          if (['input', 'img'].includes(tagName)) {
            return `${indent}<${tagName} ${attributes}>`;
          }
          
          return `${indent}<${tagName} ${attributes}>${childrenHTML}</${tagName}>`;
        }).join('\n');
      };
      
      // Generar CSS
      const generateCSS = (elements) => {
        let css = '';
        
        const processElement = (element) => {
          const { name, styles, position, size, children } = element;
          const className = `.${name.toLowerCase().replace(/\s+/g, '-')}`;
          
          // Convertir estilos a CSS
          let cssRules = [];
          if (styles) {
            for (const [key, value] of Object.entries(styles)) {
              if (value && value !== 'none' && value !== 'transparent') {
                // Convertir camelCase a kebab-case
                const cssKey = key.replace(/([A-Z])/g, '-$1').toLowerCase();
                cssRules.push(`  ${cssKey}: ${value};`);
              }
            }
          }
          
          // Añadir posición y tamaño
          if (position) {
            cssRules.push(`  position: absolute;`);
            cssRules.push(`  left: ${position.x}px;`);
            cssRules.push(`  top: ${position.y}px;`);
          }
          if (size) {
            cssRules.push(`  width: ${size.width}px;`);
            cssRules.push(`  height: ${size.height}px;`);
          }
          
          if (cssRules.length > 0) {
            css += `${className} {\n${cssRules.join('\n')}\n}\n\n`;
          }
          
          // Procesar hijos recursivamente
          if (children && children.length) {
            children.forEach(processElement);
          }
        };
        
        elements.forEach(processElement);
        
        return css;
      };
      
      // Generar TypeScript
      const generateTS = (componentName) => {
        return `import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-${componentName}',
  templateUrl: './${componentName}.component.html',
  styleUrls: ['./${componentName}.component.css']
})
export class ${componentName.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('')}Component implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}`;
      };
      
      return {
        html: generateHTML(elements),
        css: generateCSS(elements),
        ts: generateTS(componentName)
      };
    };
    
    const angularComponent = generateAngularComponent(project.name, elementTree);
    
    res.status(200).json({
      message: 'Código exportado con éxito',
      component: angularComponent
    });
  } catch (error) {
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
      name: `${elementData.name} (copia)`,
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