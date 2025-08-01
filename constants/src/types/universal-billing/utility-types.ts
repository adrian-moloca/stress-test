export type ObjectPath<T, Prefix extends string = ''> = T extends { kind: any }
  ? Prefix
  : T extends object
    ? { [K in keyof T]: ObjectPath<T[K], `${Prefix}${Prefix extends '' ? '' : '.'}${K & string}`> }[keyof T]
    : never

export type tMPPattern = {
  role: string,
  cmd: string
}
