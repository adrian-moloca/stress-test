type EnumType = {[key: number]: string}

export function getEnumValues (enumObject: EnumType) {
  return Object.values(enumObject).filter(v => isNaN(Number(v)))
}
