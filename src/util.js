// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
/**
 * Check whether a value is in an array.
 */
export function valueIn(value, array) {
  return array.indexOf(value) >= 0;
}
/**
 * Check whether array is null or empty, and type guards agains null
 */
export function hasEntries(array) {
  return array !== null && array.length !== 0;
}
/**
 * Splits a multinline string into an array of lines
 *
 * @export
 * @param {string} multiline
 * @returns {string[]}
 */
export function splitLines(multiline) {
  // Split lines (retaining newlines)
  // We use !postfix, as we also match empty string,
  // so we are guaranteed to get at elast one match
  return multiline.match(/^.*(\r\n|\r|\n|$)/gm);
}
export function deepCopy(obj) {
  if (typeof obj !== "object") {
    if (valueIn(typeof obj, ["string", "number", "boolean"])) {
      return obj;
    }
    throw new TypeError("Cannot deepcopy non-object");
  }
  if (obj === null) {
    return null;
  } else if (Array.isArray(obj)) {
    let l = obj.length;
    let o = new Array(l);
    for (let i = 0; i < l; i++) {
      o[i] = deepCopy(obj[i]);
    }
    return o;
  } else {
    let a = obj;
    let r = {};
    if (a.prototype !== undefined) {
      r.prototype = a.prototype;
    }
    for (let k in obj) {
      r[k] = deepCopy(a[k]);
    }
    return r;
  }
}
/**
 * Shallow copy routine for objects
 */
export function shallowCopy(original) {
  // First create an empty object with
  // same prototype of our original source
  let clone = Object.create(Object.getPrototypeOf(original));
  for (let k in original) {
    // Don't copy function
    let ok = original[k];
    if (
      ok !== null &&
      ok !== undefined &&
      ok.hasOwnProperty("constructor") &&
      ok.constructor === Function
    ) {
      continue;
    }
    let pDesc = Object.getOwnPropertyDescriptor(original, k);
    // Don't copy properties with getter
    if (!pDesc || pDesc.get) {
      continue;
    }
    // copy each property into the clone
    Object.defineProperty(clone, k, pDesc);
  }
  return clone;
}
/**
 * Do a shallow, element-wise equality comparison on two arrays.
 */
export function arraysEqual(a, b) {
  if (a === b) {
    return true;
  }
  if (a === null || b === null) {
    return false;
  }
  if (a.length !== b.length) {
    return false;
  }
  for (let i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) {
      return false;
    }
  }
  return true;
}
/**
 * Find the shared common starting sequence in two arrays
 */
export function findSharedPrefix(a, b) {
  if (a === null || b === null) {
    return null;
  }
  if (a === b) {
    // Only checking for instance equality
    return a.slice();
  }
  let i = 0;
  for (; i < Math.min(a.length, b.length); ++i) {
    if (a[i] !== b[i]) {
      break;
    }
  }
  return a.slice(0, i);
}
/**
 * Check whether `parent` is contained within the start of `child`
 *
 * Note on terminology: Parent is here the shortest array, as it will
 * be the parent in a tree-view of values, e.g. a path. In other words, parent
 * is a subsequence of child.
 */
export function isPrefixArray(parent, child) {
  if (parent === child) {
    return true;
  }
  if (parent === null || parent.length === 0) {
    return true;
  }
  if (child === null || parent.length > child.length) {
    return false;
  }
  for (let i = 0; i < parent.length; ++i) {
    if (parent[i] !== child[i]) {
      return false;
    }
  }
  return true;
}
/**
 * Sort array by attribute `key` (i.e. compare by array[0][key] < array[1][key]). Stable.
 */
export function sortByKey(array, key) {
  return stableSort(array, function(a, b) {
    let x = a[key];
    let y = b[key];
    return x < y ? -1 : x > y ? 1 : 0;
  });
}
/**
 * Utility function to repeat a string
 */
export function repeatString(str, count) {
  if (count < 1) {
    return "";
  }
  let result = "";
  let pattern = str.valueOf();
  while (count > 1) {
    if (count & 1) {
      result += pattern;
    }
    count >>= 1;
    pattern += pattern;
  }
  return result + pattern;
}
/**
 * Calculate the cumulative sum of string lengths for an array of strings
 *
 * Example:
 *   For the arary ['ab', '123', 'y', '\t\nfoo'], the output would be
 *   [2, 5, 6, 11]
 */
export function accumulateLengths(arr) {
  let ret = [];
  arr.reduce(function(a, b, i) {
    return (ret[i] = a + b.length);
  }, 0);
  return ret;
}
/**
 * Filter for Array.filter to only have unique values
 */
export function unique(value, index, self) {
  return self.indexOf(value) === index;
}
/**
 * Return the intersection of two arrays (with no duplicates)
 */
export function intersection(a, b) {
  let ret = [];
  // Loop over longest, so that indexOf works on shortest
  [a, b] = a.length > b.length ? [a, b] : [b, a];
  for (let ia of a) {
    if (b.indexOf(ia) !== -1) {
      ret.push(ia);
    }
  }
  return ret;
}
/**
 * Similar to Array.sort, but guaranteed to keep order stable
 * when compare function returns 0
 */
export function stableSort(arr, compare) {
  let sorters = [];
  for (let i = 0; i < arr.length; ++i) {
    sorters.push({ index: i, key: arr[i] });
  }
  sorters = sorters.sort((a, b) => {
    return compare(a.key, b.key) || a.index - b.index;
  });
  let out = new Array(arr.length);
  for (let i = 0; i < arr.length; ++i) {
    out[i] = arr[sorters[i].index];
  }
  return out;
}
export function copyObj(obj, target) {
  if (!target) {
    target = {};
  }
  for (let prop in obj) {
    if (obj.hasOwnProperty(prop)) {
      target[prop] = obj[prop];
    }
  }
  return target;
}
/**
 * Create or populate a select element with string options
 */
export function buildSelect(options, select) {
  if (select === undefined) {
    select = document.createElement("select");
  }
  for (let option of options) {
    let opt = document.createElement("option");
    opt.value = opt.innerHTML = option;
    select.appendChild(opt);
  }
  return select;
}
