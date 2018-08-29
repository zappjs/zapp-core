import * as _ from 'lodash';
import * as Case from 'case';
import Handlebars from 'handlebars';
import * as uuidv5 from 'uuid/v5';

function getType(val) {
  if (val === undefined) {
    return 'Undefined';
  } else if (val === null) {
    return 'Null';
  } else if (val && val.getType && typeof val.getType === 'function' && val.getType() === 'code') {
    return 'CodeItem';
  }
  return val.constructor.name || 'Object';
}

function isArray(val) {
  return getType(val) === 'Array';
}

function isBoolean(val) {
  return getType(val) === 'Boolean';
}

function isCode(val) {
  return getType(val) === 'CodeItem';
}

function isFalse(val) {
  return val === false;
}

function isNull(val) {
  return getType(val) === 'Null';
}

function isNumber(val) {
  return getType(val) === 'Number';
}

function isObject(val) {
  return getType(val) === 'Object';
}

function isString(val) {
  return getType(val) === 'String';
}

function isTrue(val) {
  return val === true;
}

function isUndefined(val) {
  return getType(val) === 'Undefined';
}

export default function engine(specs, template) {
  Handlebars.registerHelper('any', anyHelper);
  Handlebars.registerHelper('case', caseHelper);
  Handlebars.registerHelper('code', codeHelper);
  Handlebars.registerHelper('concat', concatHelper);
  Handlebars.registerHelper('constant', constantHelper);
  Handlebars.registerHelper('eq', eqHelper);
  Handlebars.registerHelper('eqAll', eqAllHelper);
  Handlebars.registerHelper('eqAny', eqAnyHelper);
  Handlebars.registerHelper('every', everyHelper);
  Handlebars.registerHelper('hasParams', hasParamsHelper);
  Handlebars.registerHelper('hash', hashHelper);
  Handlebars.registerHelper('import', importHelper);
  Handlebars.registerHelper('indent', indentHelper);
  Handlebars.registerHelper('json', jsonHelper);
  Handlebars.registerHelper('jsx', jsxHelper);
  Handlebars.registerHelper('ne', neHelper);
  Handlebars.registerHelper('neAll', neAllHelper);
  Handlebars.registerHelper('neAny', neAnyHelper);
  Handlebars.registerHelper('none', noneHelper);
  Handlebars.registerHelper('some', someHelper);
  Handlebars.registerHelper('str', strHelper);
  Handlebars.registerHelper('substr', substrHelper);
  Handlebars.registerHelper('swiftCreate', swiftCreateHelper);
  Handlebars.registerHelper('swiftProperties', swiftPropertiesHelper);
  Handlebars.registerHelper('swiftValue', swiftValueHelper);
  Handlebars.registerHelper('typeof', typeofHelper);
  Handlebars.registerHelper('uri', uriHelper);
  const compiler = Handlebars.compile(template);
  const result = compiler(specs);
  return result;
}

function anyHelper(...args) {
  const opts = args[args.length - 1];
  const conditions = args.slice(0, -1);
  const any = conditions.reduce((result, condition) => {
    if (condition || result) {
      return true;
    }
    return false;
  }, false);
  if (any) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
}

function caseHelper(val, type, opts) {
  const cases = [
    'camel',
    'constant',
    'header',
    'kebab',
    'pascal',
    'snake'
  ];
  if (!cases.includes(type)) {
    return val;
  }
  return Case[type](val);
}

function codeHelper(code, indention) {
  const value = typeof code.value === 'string' ? code.value : '';
  return value.replace(
    /\n/g,
    `\n${'  '.repeat(indention)}`
  );
}

function concatHelper() {
  return Array.prototype.slice.call(arguments)
    .slice(0, -1)
    .reduce((result, string) => {
      return `${result}${string}`;
    });
}

function constantHelper(name, allConstants, pathName, opts) {
  const params = {
    name,
    value: allConstants[name]
  };
  return opts.fn(params);
}

function eqHelper(a, b, opts) {
  if (a === b) {
    return opts.fn(this);
  }
  return opts.inverse(this);
}

function eqAllHelper() {
  const opts = arguments[arguments.length - 1];
  const values = Array.prototype.slice
    .call(arguments)
    .slice(0, -1);

  for (var i = 1; i < values.length; i++) {
    if (values[i] !== values[0]) {
      return opts.inverse(this);
    }
  }

  return opts.fn(this);
}

function eqAnyHelper() {
  const opts = arguments[arguments.length - 1];
  const values = Array.prototype.slice
    .call(arguments)
    .slice(0, -1);

  for (var i = 1; i < values.length; i++) {
    if (values[i] === values[0]) {
      return opts.fn(this);
    }
  }

  return opts.inverse(this);
}

function everyHelper() {
  const opts = arguments[arguments.length - 1];
  const isValid = Array.prototype.slice.call(arguments)
    .slice(0, -1).every(arg => !!arg);

  if (isValid) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
}

function hashHelper() {
  const values = Array.prototype.slice
    .call(arguments)
    .slice(0, -1);
  return uuidv5(
    values.join('/'),
    'f9d98867-c42c-4339-a0bf-75d63e82eb0a'
  )
    .toUpperCase()
    .replace(/-/g, '');
}

function importHelper(name, allImports, pathName, opts) {
  if (!allImports[name]) {
    throw new Error(`Unknown import: ${name}`);
  }
  const currentImport = allImports[name].split(':');
  let moduleName = currentImport[0];
  if (moduleName.substr(0, 2) === './') {
    moduleName = pathName + moduleName.substr(1);
  }
  const params = {
    name: currentImport.length === 1 ? name : `{ ${name} }`,
    module: moduleName
  };
  return opts.fn(params);
}

function indent(indention, added = 0) {
  return "\t".repeat(indention + added);
}

function indentHelper(val, indention, style = '\t', skipFirst = true) {
  if (typeof style === 'object') {
    style = '\t';
  }
  if (typeof skipFirst === 'object') {
    skipFirst = true;
  }
  return (isCode(val) ? val.value : val)
    .split("\n")
    .map((v, i) => {
      if (skipFirst === true && i === 0) {
        return v;
      }
      return `${style.repeat(indention)}${v}`
    })
    .join("\n");
}

function jsonHelper(data = {}, indentionStart = 1, parser = 'javascript') {
  if (typeof indentionStart === 'object') {
    indentionStart = 0;
  }
  if (typeof parser === 'object') {
    parser = 'javascript';
  }

  const punctuationParsers = {
    javascript: {
      key: (key) => {
        if (/^[a-z0-9_]+$/.test(key)) {
          return "'";
        }
        return '';
      },
      value: (value) => {
        if (/\$\{[a-z]+\}/.test(value)) {
          return '`'
        }
        return "'"
      },
      objectPrefix: '{',
      objectSuffix: '}'
    },
    swift: {
      objectPrefix: '[',
      objectSuffix: ']'
    }
  };

  const punctuation = {
    ...{
      key: () => '',
      value: () => '',
      objectPrefix: '',
      objectSuffix: ''
    },
    ...punctuationParsers[parser]
  };

  const objectPrefix = punctuation.objectPrefix;
  const objectSuffix = punctuation.objectSuffix;

  function render(data, indention) {
    if (isUndefined(data)) {
      return 'undefined';
    } else if (isNull(data)) {
      return 'null';
    } else if (isTrue(data)) {
      return 'true';
    } else if (isFalse(data)) {
      return 'false';
    } else if (isNumber(data)) {
      return data.toString();
    } else if (isCode(data)) {
      return data.value.toString().replace(/\n/g, `\n${'  '.repeat(indention)}`);
    } else if (!isArray(data) && !isObject(data)) {
      const str = data.toString();
      const strPuncuation = punctuation.value(str);
      return `${strPuncuation}${str}${strPuncuation}`;
    }
    let n = 0;
    let json = '';
    if (Array.isArray(data)) {
      json += '[';
      if (data.length) {
        json += "\n";
        json += indent(indention, 1);
        data.forEach((d, i) => {
          if (i !== 0) {
            json += ',';
            json += "\n";
            json += indent(indention, 1);
          }
          json += render(d, indention + 1);
        });
        json += "\n";
        json += indent(indention);
      }
      json += ']';
      return json;
    }
    json = objectPrefix;
    n = 0;
    for (var key in data) {
      if (n !== 0) {
        json += ',';
      }
      json += "\n";
      json += indent(indention, 1);
      if (data[key] === key) {
        json += `${key}`;
      } else {
        const keyPunctuation = punctuation.key(key);
        json += `${keyPunctuation}${key}${keyPunctuation}: `;
      }
      if (isBoolean(data[key]) || isNumber(data[key])) {
        json += data[key];
      } else if (isCode(data[key])) {
        json += data[key].value;
      } else if (isArray(data[key])) {
        json += render(data[key], indention + 1);
      } else if (isObject(data[key])) {
        json += render(data[key], indention + 1);
      } else if (data[key] !== key) {
        const valuePunctuation = punctuation.value(data[key]);
        json += `${valuePunctuation}${data[key]}${valuePunctuation}`;
      }
      n++;
    }
    json += "\n";
    json += indent(indention);
    json += objectSuffix;
    return json;
  }

  const rendered = render(data, indentionStart);
  return rendered;
}

function jsxHelper(elements, indentionStart, additionalAttributes = []) {
  function render(renderElements, indention, firstIndention, elementName) {
    if (!renderElements || (!isObject(renderElements) && !isArray(renderElements))) {
      return;
    }
    let elements = renderElements;
    if (!Array.isArray(renderElements)) {
      elements = [];
      for (var tagName in renderElements) {
        elements.push(Object.assign({
          tag: tagName.split('.')[0]
        }, renderElements[tagName]));
      }
    }
    let jsx = indent(firstIndention !== undefined ? firstIndention : indention);
    let indentionAddition = 0;
    elements.forEach((element, elementIndex) => {
      const tag = element.tag || 'div';
      if (elementIndex !== 0) {
        jsx += indent(indention);
      }
      if (element.show) {
        indentionAddition = 1;
        jsx += `{${element.show} && (\n`;
        jsx += indent(indention, indentionAddition);
      }
      jsx += `<${tag}`;
      let props = {};
      Object.keys(element).forEach((key) => {
        if (!isObject(element[key]) && !['className', 'children', 'props', 'tag'].includes(key)) {
          props[key] = element[key];
        }
      });
      if (element.props) {
        props = {
          ...props,
          ...element.props
        }
      }
      const attributes = props || {};
      const defaultAttributes = [
        'href',
        'key',
        'label',
        'name',
        'onChange',
        'onClick',
        'onSubmit',
        'placeholder',
        'ref',
        'rel',
        'target',
        'title',
        'type',
        'value'
      ].concat(additionalAttributes);
      defaultAttributes.forEach((attributeName) => {
        if (element[attributeName]) {
          attributes[attributeName] = element[attributeName];
        }
      });
      if (!_.isEmpty(attributes)) {
        let attributeNameFormatted;
        let attributeValue;
        for (let attributeName in attributes) {
          attributeNameFormatted = defaultAttributes.includes(attributeName)
            ? attributeName
            : attributeName;
          attributeValue = attributes[attributeName];
          if (Object.keys(attributes).length > 1 || element.className || element.styles) {
            jsx += "\n";
            jsx += indent(indention, 1 + indentionAddition);
          } else {
            jsx += ' ';
          }
          if (attributeValue === true) {
            jsx += attributeNameFormatted;
          } else if (isCode(attributeValue)) {
            jsx += `${attributeNameFormatted}=${attributeValue.value}`;
          } else if (/^on/.test(attributeName)) {
            jsx += `${attributeNameFormatted}={event => this.handle${Case.pascal(attributeValue)}(event${elementName ? `, ${elementName}` : ''})}`;
          } else if (isObject(attributeValue)) {
            if (attributeValue.type === 'element') {
              jsx += `${attributeNameFormatted}={\n`;
              jsx += render(attributeValue.element, indention + 2 + indentionAddition);
              jsx += indent(indention, 1 + indentionAddition);
              jsx += `}`;
            } else {
              jsx += `${attributeNameFormatted}={`;
              jsx += jsonHelper(attributeValue.value ? attributeValue.value : attributeValue, indention + 1 + indentionAddition, 'javascript');
              jsx += `}`;
            }
          } else {
            jsx += `${attributeNameFormatted}="${attributeValue}"`;
          }
        }
        if (Object.keys(attributes).length > 1) {
          jsx += "\n";
          jsx += `${indent(indention, indentionAddition)}`;
        }
      }
      if (element.className) {
        if (Object.keys(attributes).length > 0 || element.styles) {
          jsx += "\n";
          jsx += `${indent(indention, 1 + indentionAddition)}`;
        } else {
          jsx += ' ';
        }
        if (Array.isArray(element.className)) {
          jsx += `className={classNames(`;
          element.className.forEach((className, index) => {
            jsx += "\n";
            jsx += `${indent(indention, (Object.keys(attributes).length > 0 || element.styles ? 2 : 1) + indentionAddition)}`;
            if (isObject(className)) {
              if (className.condition) {
                if (isCode(className.condition)) {
                  jsx += className.condition.value
                } else {
                  jsx += className.condition
                }
                jsx += `\n${indent(indention, 2 + indentionAddition)}? `;
              }
              jsx += `styles.${className.className}`
              if (className.condition) {
                jsx += `\n${indent(indention, 2 + indentionAddition)}: null`;
              }
            } else {
              jsx += `styles.${className}${index === element.className.length - 1 ? '' : ','}`;
            }
          });
          jsx += "\n";
          jsx += `${indent(indention, (Object.keys(attributes).length > 0 || element.styles ? 1 : 0) + indentionAddition)}`;
          jsx += `)}`;
        } else {
          jsx += `className={styles.${element.className}}`
        }
        if (Object.keys(attributes).length > 0 || element.styles) {
          jsx += "\n"
          jsx += `${indent(indention, indentionAddition)}`
        }
      }
      if (element.styles) {
        if (!Object.keys(attributes).length && !element.className) {
          jsx += ' ';
        }
        jsx += indent(indention, 1 + indentionAddition)
        jsx += 'style={['
        let styleValue
        element.styles.forEach((styleName, styleIndex) => {
          if (styleIndex !== 0) {
            jsx += ','
          }
          jsx += "\n"
          jsx += indent(indention, 2 + indentionAddition)
          if (isObject(styleName)) {
            if (styleName.type === 'css') {
              jsx += jsonHelper(styleName.style, indention + 2 + indentionAddition, 'javascript')
            } else {
              if (styleName.condition) {
                jsx += `${styleName.condition} ? `
              }
              jsx += `${name}.styles.${styleName.style}`
              if (styleName.condition) {
                jsx += ` : null`
              }
            }
          } else {
            jsx += `${name}.styles.${styleName}`
          }
        })
        jsx += "\n"
        jsx += indent(indention, 1 + indentionAddition)
        jsx += ']}'
        jsx += "\n"
        jsx += `${indent(indention, indentionAddition)}`
      }
      let children = {};
      Object.keys(element).forEach((key) => {
        if (isObject(element[key]) && key !== 'props') {
          children[key] = element[key];
        }
      });
      if (isObject(element.children)) {
        children = {
          ...children,
          ...element.children
        };
      }
      if (Object.keys(children).length || element.children || element['$map']) {
        jsx += `>\n`
        if (element['$map']) {
          let mapChildren = {};
          Object.keys(element['$map']).forEach((key) => {
            if (isObject(element['$map'][key])) {
              mapChildren[key] = element['$map'][key];
            }
          });
          jsx += indent(indention, 1 + indentionAddition)
          jsx += `{${element['$map'].array}.map((${element['$map'].element}${element['$map'].index ? `, ${element['$map'].index}` : ''}) => {`
          jsx += "\n"
          jsx += indent(indention, 2 + indentionAddition)
          jsx += 'return ('
          jsx += "\n"
          jsx += render(mapChildren, indention + 3 + indentionAddition, undefined, element['$map'].element)
          jsx += indent(indention, 2 + indentionAddition)
          jsx += ');'
          jsx += "\n"
          jsx += indent(indention, 1 + indentionAddition)
          jsx += '})}'
          jsx += "\n"
        } else if (isCode(element.children)) {
          jsx += indent(indention, 1 + indentionAddition)
          jsx += element.children.value
          jsx += "\n"
        } else if (Object.keys(children).length) {
          jsx += render(children, indention + 1 + indentionAddition, undefined, elementName)
        } else {
          jsx += indent(indention, 1 + indentionAddition)
          jsx += element.children
          jsx += "\n"
        }
        jsx += indent(indention, indentionAddition)
        jsx += `</${tag}>`
      } else {
        if (_.isEmpty(attributes) && !element.styles) {
          jsx += ' '
        }
        jsx += `/>`
      }
      if (element.show) {
        jsx += "\n"
        jsx += indent(indention)
        jsx += `)}`
      }
      jsx += "\n"
    })
    return jsx
  }
  if (isCode(elements)) {
    return jsonHelper(elements, indentionStart, 'javascript');
  }
  const rendered = (render(elements, indentionStart, 0) || '').replace(/\n$/, '');
  return rendered;
}

function neHelper(a, b, opts) {
  if (a !== b) {
    return opts.fn(this);
  }
  return opts.inverse(this);
}

function neAllHelper() {
  const opts = arguments[arguments.length - 1];
  const values = Array.prototype.slice
    .call(arguments)
    .slice(0, -1);

  for (var i = 1; i < values.length; i++) {
    if (values[i] === values[0]) {
      return opts.inverse(this);
    }
  }

  return opts.fn(this);
}

function neAnyHelper() {
  const opts = arguments[arguments.length - 1];
  const values = Array.prototype.slice
    .call(arguments)
    .slice(0, -1);

  for (var i = 1; i < values.length; i++) {
    if (values[i] !== values[0]) {
      return opts.fn(this);
    }
  }

  return opts.inverse(this);
}

function noneHelper() {
  const opts = arguments[arguments.length - 1];
  const isValid = Array.prototype.slice.call(arguments)
    .slice(0, -1).every(arg => !arg);

  if (isValid) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
}

function someHelper() {
  const opts = arguments[arguments.length - 1];
  const isValid = Array.prototype.slice.call(arguments)
    .slice(0, -1).some(arg => !!arg);

  if (isValid) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
}

function strHelper(str) {
  if (!!str.match(/\$\{/)) {
    return '`' + str + '`'
  }
  return "'" + str + "'"
}

function substrHelper() {
  const str = arguments[0];
  const start = arguments[1];
  const length = arguments[3] ? arguments[2] : undefined;
  const opts = arguments[arguments.length - 1];
  return str.substr(start, length);
}

const swiftColors = {
  black: 'UIColor.black',
  blue: 'UIColor.blue',
  brown: 'UIColor.brown',
  clear: 'UIColor.clear',
  cyan: 'UIColor.cyan',
  darkGray: 'UIColor.darkGray',
  darkText: 'UIColor.darkText',
  gray: 'UIColor.gray',
  green: 'UIColor.green',
  lightGray: 'UIColor.lightGray',
  lightText: 'UIColor.lightText',
  magenta: 'UIColor.magenta',
  orange: 'UIColor.orange',
  purple: 'UIColor.purple',
  red: 'UIColor.red',
  white: 'UIColor.white',
  yellow: 'UIColor.yellow'
};
const swiftValues = {
  action: (name, value, type, suffix) => {
    return `${name}${suffix}.addTarget(self, action: #selector(${value}), for: .touchUpInside)`;
  },
  activityIndicatorViewStyle: {
    gray: '.gray',
    white: '.white',
    whiteLarge: '.whiteLarge'
  },
  autocapitalizationType: {
    allCharacters: '.allCharacters',
    none: '.none',
    sentences: '.sentences',
    words: '.words'
  },
  backgroundColor: swiftColors,
  baselineAdjustment: {
    alignBaselines: '.alignBaselines',
    alignCenters: '.alignCenters',
    none: '.none'
  },
  barTintColor: swiftColors,
  borderStyle: {
    bezel: '.bezel',
    line: '.line',
    none: '.none',
    roundedRect: '.roundedRect'
  },
  contentMode: {
    bottom: '.bottom',
    bottomLeft: '.bottomLeft',
    bottomRight: '.bottomRight',
    center: '.center',
    left: '.left',
    redraw: '.redraw',
    right: '.right',
    scaleAspectFill: '.scaleAspectFill',
    scaleAspectFit: '.scaleAspectFit',
    scaleToFill: '.scaleToFill',
    top: '.top',
    topLeft: '.topLeft',
    topRight: '.topRight'
  },
  currentPageIndicatorTintColor: swiftColors,
  lineBreakMode: {
    byCharWrapping: '.byCharWrapping',
    byClipping: '.byClipping',
    byTruncatingHead: '.byTruncatingHead',
    byTruncatingMiddle: '.byTruncatingMiddle',
    byTruncatingTail: '.byTruncatingTail',
    byWordWrapping: '.byWordWrapping'
  },
  constraints: (name, values, type, suffix, parentView) => {
    let result = `${name}${suffix}.translatesAutoresizingMaskIntoConstraints = false\n`;
    const keys = Object.keys(values);
    keys.forEach((key, index) => {
      const value = values[key];
      const anchor = value.anchor
        ? `${value.anchor}Anchor`
        : /Anchor$/.test(key) ? key : `${key}Anchor`;
      const multiplier = value.multiplier
        ? `, multiplier: ${value.multiplier}`
        : '';
      const constant = value.constant
        ? `, constant: ${value.constant}`
        : '';
      const constraint = value.operator === 'equalToConstant'
        ? `equalToConstant: ${value.constant}`
        : `${value.operator || 'equal'}To: ${value.view || parentView}.${anchor}${multiplier}${constant}`;
      result += `${name}${suffix}.${/Anchor$/.test(key) ? key : `${key}Anchor`}.constraint(${constraint}).isActive = true`;
      if (index !== keys.length - 1) {
        result += '\n';
      }
    });
    return result;
  },
  currentPageIndicatorTintColor: swiftColors,
  font: (name, value, type, suffix) => {
    return `${name}${suffix}.font = UIFont.${value.type}Font(ofSize: ${value.pointSize})`;
  },
  frame: (name, value, type, suffix) => {
    return `${name}${suffix}.frame = CGRect(x: ${value.x || '0.0'}, y: ${value.y || '0.0'}, width: ${value.width || '0.0'}, height: ${value.height || '0.0'})`;
  },
  image: (name, value, type, suffix) => {
    return `${name}${suffix}.image = UIImage(named: "${value}")`;
  },
  layer: (name, value, type, suffix, parentView) => {
    let result = '';
    Object.keys(value).forEach((key, index) => {
      if (index > 0) {
        result += '\n';
      }
      let newValue = value[key];
      if (key === 'borderColor' && swiftColors[newValue]) {
        newValue = `${swiftColors[newValue]}.cgColor`;
      } else if (swiftValues[key] && typeof swiftValues[key] === 'function') {
        newValue += swiftValues[key](name, value, type, suffix, parentView);
      }
      result += `${name}${suffix}.layer.${key} = ${newValue}`;
    });
    return result;
  },
  pageIndicatorTintColor: swiftColors,
  refreshControl: (name, value, type, suffix) => {
    let result = `let ${name}${suffix}RefreshControl = UIRefreshControl()\n`;
    result += `${name}${suffix}RefreshControl.addTarget(self, action: #selector(${value.action}), for: .valueChanged)\n`;
    result += `${name}${suffix}.refreshControl = ${name}${suffix}RefreshControl`;
    return result;
  },
  registeredClasses: (name, value, type, suffix) => {
    let result = '';
    Object.keys(value).forEach((id) => {
      result += `${name}${suffix}.register(${value[id]}.self, forCellWithReuseIdentifier: "${id}")`;
    });
    return result;
  },
  startAnimating: (name, value, type, suffix) => {
    return `${name}${suffix}.startAnimating()`;
  },
  subviews: (name, value, type, suffix, parentView) => {
    return swiftValueHelper(name, value, type, suffix, parentView);
  },
  tableView: (name, value, type, suffix) => {
    if (value.sectionIndexColor) {
      return `${name}${suffix}.sectionIndexColor = ${swiftColors[value.sectionIndexColor]}`;
    }
    return false;
  },
  textAlignment: {
    center: '.center',
    jusitifed: '.justified',
    left: '.left',
    natural: '.natural',
    right: '.right'
  },
  textColor: swiftColors,
  tintColor: swiftColors,
  title: (name, value, type, suffix) => {
    return `${name}${suffix}.setTitle("${value}", for: .normal)`;
  },
  titleColor: (name, value, type, suffix) => {
    return `${name}${suffix}.setTitleColor(${swiftColors[value]}, for: .normal)`;
  },
  titleTextAttributes: (name, value, type, suffix) => {
    let result = `${name}${suffix}.titleTextAttributes = [\n`;
    const values = Object.keys(value);
    values.forEach((key, index) => {
      let newValue = value[key];
      if (key === 'foregroundColor' && swiftColors[newValue]) {
        newValue = swiftColors[newValue];
      } else if (swiftValues[key] && typeof swiftValues[key] === 'function') {
        newValue += swiftValues[key](name, value, type, suffix, parentView);
      }
      result += `\tNSAttributedStringKey.${key} : ${newValue}`;
      if (index !== values.length - 1) {
        result += ',';
      }
      result += '\n';
    });
    result += ']';
    return result;
  }
};
const skipSwiftValues = ['cellsPerRow', 'data', 'subviews', 'type'];

function swiftCreateHelper(name, values, type = 'view', suffix = '', parentView = 'self.view', isController = false) {
  if (typeof type === 'object') {
    type = '';
  }
  if (typeof suffix === 'object') {
    suffix = '';
  }
  if (typeof parentView === 'object') {
    parentView = 'self.view';
  }
  if (typeof isController === 'object') {
    isController = false;
  }
  let swiftInit = '';
  if (type === 'collectionView') {
    swiftInit = `frame: self.view.frame, collectionViewLayout: ColumnFlowLayout(cellsPerRow: ${values.cellsPerRow ? values.cellsPerRow : '1'})`;
  } else if (type === 'pageView') {
    swiftInit = 'transitionStyle: .scroll, navigationOrientation: .horizontal, options: nil';
  } else if (type === 'tableView') {
    swiftInit = `frame: self.view.frame, style: ${values.tableView && values.tableView.style ? `.${values.tableView.style}` : '.plain'}`;
  }
  const controllerSuffix = isController ? 'Controller' : '';
  const viewSuffix = isController ? 'Controller.view' : '';
  const viewName = `${name}${suffix}${viewSuffix}`;
  let swiftValue = `\n${name}${suffix}${controllerSuffix} = UI${caseHelper(type, 'pascal')}${controllerSuffix}(${swiftInit})`;
  swiftValue += `\n${parentView}.addSubview(${viewName})`;
  if (values.subviews) {
    Object.keys(values.subviews).forEach((subviewKey) => {
      swiftValue += swiftCreateHelper(
        subviewKey,
        values.subviews[subviewKey],
        values.subviews[subviewKey].type,
        caseHelper(values.subviews[subviewKey].type, 'pascal'),
        viewName
      );
    })
  }
  return swiftValue;
}

function swiftValueHelper(name, values, type = 'view', suffix = '', parentView = 'self.view', isController = false) {
  if (typeof type === 'object') {
    type = '';
  }
  if (typeof suffix === 'object') {
    suffix = '';
  }
  if (typeof parentView === 'object') {
    parentView = 'self.view';
  }
  if (typeof isController === 'object') {
    isController = false;
  }

  const controllerSuffix = isController ? 'Controller' : '';
  const viewName = isController ? `${name}${suffix}Controller.view` : name;

  let swiftValue = '';
  Object.keys(values).forEach((key) => {
    if (skipSwiftValues.includes(key)) {
      return;
    }

    swiftValue += `${swiftValue.length > 0 ? '\n' : ''}`;

    let value = values[key];

    if (swiftValues[key] && typeof swiftValues[key] === 'function') {
      const result = swiftValues[key](viewName, value, type, isController ? '' : suffix, parentView, isController);
      if (result === false) {
        return;
      }
      swiftValue += result;
      return;
    } else if (typeof value === 'object' && !isCode(value) && !swiftValues[key]) {
      swiftValue += swiftValueHelper(`${viewName}.${key}`, value, type, isController ? '' : suffix, parentView, isController);
      return;
    }

    if (swiftValues[key]) {
      if (typeof value === 'object') {
        value = `UIColor(red: ${value.red.toFixed(1)}/255.0, green: ${value.green.toFixed(1)}/255.0, blue: ${value.blue.toFixed(1)}/255.0, alpha: ${value.alpha.toFixed(1)})`;
      } else {
        value = swiftValues[key][value];
      }
    } else if (isCode(value)) {
      value = value.value;
    } else if (typeof value === 'boolean' || typeof value === 'number') {
      value = value.toString();
    } else if (typeof value === 'string') {
      value = `"${value}"`;
    }

    swiftValue += `${isController ? viewName : `${name}${suffix}`}.${key} = ${value}`;
  });
  if (values.subviews) {
    Object.keys(values.subviews).forEach((subviewKey) => {
      swiftValue += '\n';
      swiftValue += swiftValues.subviews(
        subviewKey,
        values.subviews[subviewKey],
        values.subviews[subviewKey].type,
        caseHelper(values.subviews[subviewKey].type, 'pascal'),
        isController ? viewName : `${name}${suffix}`
      );
    })
  }
  return swiftValue;
}

function swiftPropertiesHelper(name, values, type = 'view', suffix = '', isController = false) {
  if (typeof type === 'object') {
    type = '';
  }
  if (typeof suffix === 'object') {
    suffix = '';
  }
  if (typeof isController === 'object') {
    isController = false;
  }
  const controllerSuffix = isController ? 'Controller' : '';
  const viewSuffix = isController ? 'Controller.view' : '';
  const viewName = `${name}${suffix}${viewSuffix}`;
  let swiftProperties = `var ${name}${suffix}${controllerSuffix}: UI${caseHelper(type, 'pascal')}${controllerSuffix}!`;
  if (values.subviews) {
    swiftProperties += '\n';
    Object.keys(values.subviews).forEach((subviewKey) => {
      swiftProperties += '\n';
      swiftProperties += swiftPropertiesHelper(
        subviewKey,
        values.subviews[subviewKey],
        values.subviews[subviewKey].type,
        caseHelper(values.subviews[subviewKey].type, 'pascal')
      )
    })
  }
  return swiftProperties;
}

function typeofHelper(a, b, opts) {
  if (
    isCode(a)
    || (typeof a === b && !Array.isArray(a))
    || Array.isArray(a) && b === 'array'
  ) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
}

function uriHelper(uri, style) {
  const uriParts = uri.split('/')
    .map((uriPart) => {
      if (uriPart.substr(0, 1) === '{') {
        if (style === ':') {
          return `:${uriPart.substr(1, uriPart.length - 2)}`;
        }
        return `$\{params.${uriPart.substr(1)}`;
      }
      return uriPart;
    })
    .join('/');

  return uriParts;
}

function hasParamsHelper(uri, opts) {
  let hasParams = false;
  uri.split('/')
    .forEach((uriPart) => {
      if (uriPart.substr(0, 1) === '{') {
        hasParams = true;
      }
    });
  if (hasParams) {
    return opts.fn(this);
  } else {
    return opts.inverse(this);
  }
}
