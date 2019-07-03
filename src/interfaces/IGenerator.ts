export interface IGenerator<P = {}> {
  (spec: P): string;
}
