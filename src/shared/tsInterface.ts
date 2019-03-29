import * as Case from 'case';

export function tsInterface(name: string, schemas, indent = '  ') {
  let interfaceString = '';
  interfaceString += `export interface I${Case.pascal(name)} {\n`
  if (schemas.type === 'function') {
    interfaceString += `${indent}(`;
    if (schemas.properties) {
      Object.keys(schemas.properties).forEach((propName) => {
        const prop = schemas.properties[propName];
        const propOptional = prop.required ? '' : '?';
        const propType = prop.type || 'any';
        interfaceString += `${propName}${propOptional}: ${Case.pascal(propType)}`;
      });
    }
    const returnType = schemas.return || 'any';
    interfaceString += `): `
    if (schemas.async) {
      interfaceString += `Promise<${returnType}>`;
    } else {
      interfaceString += returnType;
    }
    interfaceString += `;\n`;
  } else if (schemas.type === 'object') {
    if (schemas.properties) {
      Object.keys(schemas.properties).forEach((propName) => {
        const prop = schemas.properties[propName];
        const propOptional = prop.required ? '' : '?';
        let propType = 'any';
        if (prop.type === 'array') {
          if (prop.items) {
            if (prop.items.type === 'object') {
              propType = `I${Case.pascal(name)}${Case.pascal(propName)}[]`;
            } else {
              propType = `${prop.type}[]`;
            }
          } else {
            propType = 'any[]'
          }
        } else if (prop.type === 'object') {
          propType = `I${Case.pascal(name)}${Case.pascal(propName)}`;
        } else {
          propType = prop.type;
        }
        interfaceString += `${indent}${propName}${propOptional}: ${propType};\n`;
      });
    }
  }
  interfaceString +=  `}`;

  // sub interfaces
  if (schemas.type === 'object') {
    if (schemas.properties) {
      Object.keys(schemas.properties).forEach((propName) => {
        const prop = schemas.properties[propName];
        if (prop.type === 'array' && prop.items) {
          interfaceString +=  '\n\n';
          interfaceString += tsInterface(`${Case.pascal(name)}${Case.pascal(propName)}`, prop.items, indent);
        } else if (prop.type === 'object') {
          interfaceString +=  '\n\n';
          interfaceString += tsInterface(`${Case.pascal(name)}${Case.pascal(propName)}`, prop, indent);
        }
      });
    }
  }

  return interfaceString;
}