export function isType(type: string, value: any): boolean {
  return typeof value === type;
}
export function isNumber(value: any): value is number {
  return isType('number', value);
}

/**
 * Determine if passed value is an integer
 * @param <any> value: The value to inspect
 * @return <boolean>
 * @private
 */
export function isInteger(value: any): value is number {
  return isNumber(value) && isFinite(value) && Math.floor(value) === value;
}

export function isFunction(value: any): value is Function {
  return isType('function', value);
}

export function not(value: any): boolean {
  return !value;
}

export function isObject(value: any): value is object {
  return value && !Array.isArray(value) && isType('object', value);
}

export function merge<TObject, TSource>(
  target: TObject,
  source: TSource,
): TObject & TSource {
  Object.entries(source).forEach(
    ([key, value]) => ((<any>target)[key] = value),
  );

  return target as TObject & TSource;
}
