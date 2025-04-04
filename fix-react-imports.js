const fs = require('fs');
const path = require('path');

// Función para buscar archivos recursivamente
function findFiles(dir, extension, fileList = []) {
  const files = fs.readdirSync(dir);

  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      findFiles(filePath, extension, fileList);
    } else if (path.extname(file) === extension) {
      fileList.push(filePath);
    }
  });

  return fileList;
}

// Función para modificar el archivo
function modifyFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Verificar si ya tiene la importación correcta
    if (content.includes('import * as React from \'react\';')) {
      console.log(`Skipping ${filePath} - already has correct import`);
      return;
    }
    
    // Reemplazar importaciones de React
    const reactImportRegex = /import\s+React(?:,\s*{([^}]*)})?\s+from\s+['"]react['"];?/;
    const hasReactImport = reactImportRegex.test(content);
    
    if (hasReactImport) {
      // Extraer las importaciones nombradas si existen
      const match = content.match(reactImportRegex);
      let namedImports = '';
      
      if (match && match[1]) {
        namedImports = match[1].trim();
        // Crear la declaración de constantes para las importaciones nombradas
        const constDeclaration = namedImports ? `const { ${namedImports} } = React;` : '';
        
        // Reemplazar la importación original con la nueva importación y la declaración de constantes
        content = content.replace(reactImportRegex, `import * as React from 'react';\n${constDeclaration}`);
      } else {
        // Solo reemplazar la importación de React
        content = content.replace(reactImportRegex, `import * as React from 'react';`);
      }
      
      // Guardar el archivo modificado
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Modified ${filePath}`);
    } else {
      // Añadir la importación al principio del archivo
      content = `import * as React from 'react';\n${content}`;
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Added React import to ${filePath}`);
    }
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error);
  }
}

// Directorio principal
const resourcesDir = path.join(__dirname, 'resources', 'js');

// Encontrar todos los archivos TSX
const tsxFiles = findFiles(resourcesDir, '.tsx');

// Modificar cada archivo
tsxFiles.forEach(modifyFile);

console.log(`Processed ${tsxFiles.length} TSX files`); 