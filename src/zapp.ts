import * as _ from 'lodash';
import * as validator from 'is-my-json-valid';

import CodeItem from './common/code-item';

import handlebars from './engines/handlebars';
import json from './engines/json';
import plist from './engines/plist';
import yaml from './engines/yaml';

const inputSchema = {
  type: 'object',
  properties: {
    encoder: {
      type: 'string'
    },
    engine: {
      required: true,
      type: 'string'
    },
    filename: {
      type: ['object', 'string'],
      properties: {
        engine: {
          type: 'string'
        },
        mapping: {
          type: ['object', 'string']
        },
        template: {
          type: 'string'
        }
      }
    },
    iterator: {
      type: 'string'
    },
    mapping: {
      type: ['object', 'string']
    },
    schema: {
      type: ['object', 'string']
    },
    template: {
      type: 'string'
    }
  }
};

function getMappedSpecs(mappingConfig = {}, specs, specName, specsSlice) {
  if (typeof mappingConfig === 'string') {
    return _.get(specs, mappingConfig.replace(/^\//, '').split('/'));
  }

  const mappedSpecs = {};
  Object.keys(mappingConfig).forEach((mappingName) => {
    const mapping = mappingConfig[mappingName];
    const specMappingSrc = typeof mapping === 'object' ? mapping.path : mapping;
    const specMappingFilter = typeof mapping === 'object' ? mapping.filter : undefined;

    let specValue;
    if (specName && specMappingSrc === '@key') {
      specValue = specName;
    } else if (specName && specMappingSrc === '@value') {
      specValue = _.get(specsSlice, specName);
    } else if (specName && specMappingSrc.match(/^\.\//)) {
      specValue = _.get(
        specsSlice[specName],
        specMappingSrc.replace(/^\.\//, '').split('/')
      );
    } else if (specMappingSrc.match(/^\//)) {
      specValue = _.get(
        specs,
        specMappingSrc.replace(/^\//, '').split('/')
      );
    } else {
      specValue = specMappingSrc;
    }

    if (specMappingFilter && typeof specValue === 'object') {
      specValue = _.pickBy(specValue, (specValueElement) => {
        const specValueIsValid = validator({
          type: 'object',
          properties: {
            ...specMappingFilter
          }
        })(specValueElement);
        return specValueIsValid;
      });
      if (_.isEmpty(specValue)) {
        specValue = undefined;
      }
    }
    if (specValue !== undefined) {
      _.set(mappedSpecs, mappingName, specValue);
    }
  });
  return mappedSpecs;
}

const engines = {
  handlebars,
  json,
  plist,
  yaml
};

function generate({
  encoders = {},
  files = {},
  meta = {},
  schemas = {},
  specs: tempSpecs = {},
  templates = {}
}) {
  let newSpecs = { ...tempSpecs };
  if (meta.specs) {
    Object.keys(meta.specs).forEach((specPath) => {
      const specMeta = meta.specs[specPath];
      const specPathParts = specPath.substr(1).split('/')
        .map(path => decodeURIComponent(path));
      const specExists = _.has(tempSpecs, specPathParts);
      if (specExists && specMeta.type === 'code') {
        const specValue = new CodeItem({
          mode: specMeta.mode,
          value: _.get(tempSpecs, specPathParts)
        });
        newSpecs = _.set(tempSpecs, specPathParts, specValue);
      }
    });
  }

  const generatedFiles = [];

  Object.keys(files).forEach((patternConfig) => {
    const file = files[patternConfig];

    if (file.type === 'directory') {
      generatedFiles.push({
        path: patternConfig,
        type: 'directory'
      });
      return;
    }

    const validateInput = validator(inputSchema);
    const inputIsValid = validateInput(file);
    if (!inputIsValid) {
      const field = validateInput.errors[0].field;
      const name = `${field.substr(5, 1).toUpperCase()}${field.substr(6)}`;
      throw new Error(`${name} ${validateInput.errors[0].message} for file (${patternConfig}).`);
    }

    const {
      encoder: encoderConfig,
      engine: engineConfig,
      filename: filenameConfig,
      iterator: iteratorConfig,
      mapping: mappingConfig,
      schema: schemaConfig,
      template: templateConfig
    } = files[patternConfig];

    if (typeof encoderConfig === 'string' && !encoders[encoderConfig]) {
      throw new Error(`Encoder (${encoderConfig}) does not exist for file (${patternConfig}).`);
    }
    if (!engines[engineConfig]) {
      throw new Error(`Engine (${engineConfig}) does not exist for file (${patternConfig}).`);
    }
    if (typeof iteratorConfig === 'string' && typeof filenameConfig !== 'object') {
      throw new Error(`Filename must be object if iterator is given for file (${patternConfig}).`);
    }
    if (typeof schemaConfig === 'string' && !schemas[schemaConfig]) {
      throw new Error(`Schema (${schemaConfig}) does not exist for file (${patternConfig}).`);
    }
    if (typeof templateConfig === 'string' && !templates[templateConfig]) {
      throw new Error(`Template (${templateConfig}) does not exist for file (${patternConfig}).`);
    }

    const encoder = encoders[encoderConfig];
    const engine = engines[engineConfig];
    const schema = typeof schemaConfig === 'string' ? schemas[schemaConfig] : schemaConfig;
    const template = templates[templateConfig] && templates[templateConfig].template
      ? templates[templateConfig].template : '';

    if (!iteratorConfig) {
      const filename = (() => {
        if (filenameConfig) {
          if (typeof filenameConfig === 'string') {
            return filenameConfig;
          }
          return engines[filenameConfig.engine](
            getMappedSpecs(filenameConfig.mapping, newSpecs),
            filenameConfig.template
          );
        }
        return patternConfig;
      })();

      const mappedSpecs = getMappedSpecs(mappingConfig, newSpecs);

      let content = engine(mappedSpecs, template);
      if (encoder) {
        content = encoder(content);
      }
      if (!/\n$/.test(content)) {
        content += '\n';
      }

      generatedFiles.push({
        path: filename,
        content,
        type: 'file'
      });

      return;
    }

    const specs = _.get(newSpecs, iteratorConfig.replace(/^\//, '').split('/'));

    Object.keys(specs || {}).forEach((specName) => {
      const filename = filenameConfig ? engines[filenameConfig.engine](
        getMappedSpecs(filenameConfig.mapping, newSpecs, specName, specs),
        filenameConfig.template
      ) : patternConfig;

      if (generatedFiles.find(generatedFile => generatedFile.filename === filename)) {
        throw new Error(`File already generated: ${filename}`);
      }

      const mappedSpecs = getMappedSpecs(mappingConfig, newSpecs, specName, specs);

      if (schema) {
        const validate = validator(schema);
        const isValid = validate(mappedSpecs);
        if (!isValid) {
          const mappedFieldName = validate.errors[0].field
            .substr(5)
            .split('.')
            .reduce((accum, fieldName) => {
              if (mappingConfig[accum]) {
                return accum;
              } else if (mappingConfig[fieldName]) {
                return mappingConfig[fieldName];
              }
              return `${accum}/${fieldName}`;
            }, '');
          throw new Error(`Schema failure: ${mappedFieldName} → ${validate.errors[0].field.substr(5)} ${validate.errors[0].message} for ${filename}.`);
        }
      }

      let content = engine(mappedSpecs, template);
      if (encoder) {
        content = encoder(content);
      }
      if (!/\n$/.test(content)) {
        content += '\n';
      }

      generatedFiles.push({
        path: filename,
        content,
        type: 'file'
      });
    });
  });

  return generatedFiles;
}

export default generate;
