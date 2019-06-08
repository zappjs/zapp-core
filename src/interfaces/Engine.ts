export interface Engine {
  (spec: any, template?: string): string;
}
