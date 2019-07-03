export interface IEngine<P = {}> {
  (spec: P, template?: string): string;
}
