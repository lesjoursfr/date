/**
 * Substitutes for lodash methods
 */
export function difference<T = unknown>(bigArr: Array<T>, smallArr: Array<T>): Array<T> {
  const diff = [];
  for (let i = 0; i < bigArr.length; i++) {
    const ele = bigArr[i];
    if (smallArr.indexOf(ele) == -1) {
      diff.push(ele);
    }
  }
  return diff;
}

export function flatten<T = unknown>(arr: Array<T>): Array<T> {
  return ([] as Array<T>).concat(...arr);
}

export function find<T = unknown>(arr: Array<T>, fn: (value: T) => boolean): T | null {
  let found = null;
  for (let i = 0; i < arr.length; i++) {
    if (fn(arr[i])) {
      found = arr[i];
      break;
    }
  }
  return found;
}

export function findLastIndex<T = unknown>(arr: Array<T>, fn: (value: T) => boolean): number {
  let found = -1;
  for (let i = arr.length - 1; i >= 0; i--) {
    if (fn(arr[i])) {
      found = i;
      break;
    }
  }
  return found;
}

export function includes<T = unknown>(arr: Array<T>, item: T): boolean {
  let found = false;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === item) {
      found = true;
      break;
    }
  }
  return found;
}

export function isNaN(n: unknown): boolean {
  return Number.isNaN(n);
}

export function keys(obj: object): Array<string> {
  return Object.keys(obj);
}

export function pullAt<T = unknown>(arr: Array<T>, i: number): Array<T> {
  const res = arr.splice(i, 1);
  return res;
}

export function unique<T = unknown>(arr: Array<T>): Array<T> {
  return arr.filter(function (elem, pos) {
    return arr.indexOf(elem) === pos;
  });
}
