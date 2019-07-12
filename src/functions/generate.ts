import { IEngine, IProcessor } from '../interfaces';

interface Generate {
  (config: GenerateConfig): Promise<string>;
}

interface GenerateConfig {
  engine?: IEngine;
  processor?: IProcessor;
  schema?: object;
  spec?: object;
  template?: string;
}

export const generate: Generate = async ({
  engine,
  processor,
  spec,
  template
}) => {
  const output = engine ? await engine(spec, template) : template;
  if (processor) {
    return await processor(output);
  }
  return output;
};