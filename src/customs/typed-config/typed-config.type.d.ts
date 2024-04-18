export type FlattenObjectKeys<T extends Record<string, any>, K = keyof T> = K extends string
  ? T[K] extends Record<string, any>
    ? `${K}.${FlattenObjectKeys<T[K]>}`
    : K
  : never;

export type InferType<T, Path extends FlattenObjectKeys<T>> = Path extends keyof T
  ? T[Path]
  : Path extends `${infer K}.${infer R}`
    ? K extends keyof T
      ? InferType<T[K], R>
      : never
    : never;
