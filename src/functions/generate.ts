import { IEngine, IProcessor } from '../interfaces';

interface Generate {
  (config: GenerateConfig): string;
}

interface GenerateConfig {
  engine: IEngine;
  processor?: IProcessor;
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