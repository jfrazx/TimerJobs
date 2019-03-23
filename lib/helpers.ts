export function isType(type: string, value: any): boolean {
  return typeof value === type;
}

export function isEmptyString(value: any): boolean {
  return isString(value) && value.trim() === '';
}

export function isString(value: any): value is string {
  return isType('string', value);
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

export function inRange(value: number, min = 0, max = 1): boolean {
  return Math.min(min, max) <= value && value < Math.max(min, max);
}
