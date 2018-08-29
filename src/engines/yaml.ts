import yaml from 'js-yaml';

export default function engine(specs) {
  return yaml.safeDump(specs);
}
