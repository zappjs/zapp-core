import { Engine, Processor } from '../interfaces';

interface Generate {
  (config: GenerateConfig): string;
}

interface GenerateConfig {
  engine: Engine;
  processor?: Processor;
  schema?: object;
  spec?: object;
  template?: string;
}

export const generate: Generate = ({
  engine,
  processor,
  spec,
  template
}) => {
  const output = engine(spec, template);
  if (processor) {
    return processor(output);
  }
  return output;
};