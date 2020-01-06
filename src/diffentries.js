// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { valueIn } from "./util";
/** Create a replacement diff entry */
export function opReplace(key, value) {
  return { op: "replace", key: key, value: value };
}
/** Create an addition diff entry */
export function opAdd(key, value) {
  return { op: "add", key: key, value: value };
}
/** Create a removal diff entry */
export function opRemove(key) {
  return { op: "remove", key: key };
}
/** Create a removal diff entry */
export function opAddRange(key, valuelist) {
  return { op: "addrange", key: key, valuelist: valuelist };
}
/** Create a range removal diff entry */
export function opRemoveRange(key, length) {
  return { op: "removerange", key: key, length: length };
}
/** Create a range removal diff entry */
export function opPatch(key, diff) {
  return { op: "patch", key: key, diff: diff };
}
/**
 * Validate that a diff operation is valid to apply on a given base sequence
 */
export function validateSequenceOp(base, entry) {
  if (typeof entry.key !== "number") {
    throw new TypeError(
      "Invalid patch sequence op: Key is not a number: " + entry.key
    );
  }
  let index = entry.key;
  if (entry.op === "addrange") {
    if (index < 0 || index > base.length || isNaN(index)) {
      throw new RangeError(
        "Invalid add range diff op: Key out of range: " + index
      );
    }
  } else if (entry.op === "removerange") {
    if (index < 0 || index >= base.length || isNaN(index)) {
      throw new RangeError(
        "Invalid remove range diff op: Key out of range: " + index
      );
    }
    let skip = entry.length;
    if (index + skip > base.length || isNaN(index)) {
      throw new RangeError("Invalid remove range diff op: Range too long!");
    }
  } else if (entry.op === "patch") {
    if (index < 0 || index >= base.length || isNaN(index)) {
      throw new RangeError("Invalid patch diff op: Key out of range: " + index);
    }
  } else {
    throw new Error("Invalid op: " + entry.op);
  }
}
/**
 * Validate that a diff operation is valid to apply on a given base object
 */
export function validateObjectOp(base, entry, keys) {
  let op = entry.op;
  if (typeof entry.key !== "string") {
    throw new TypeError(
      "Invalid patch object op: Key is not a string: " + entry.key
    );
  }
  let key = entry.key;
  if (op === "add") {
    if (valueIn(key, keys)) {
      throw new Error("Invalid add key diff op: Key already present: " + key);
    }
  } else if (op === "remove") {
    if (!valueIn(key, keys)) {
      throw new Error("Invalid remove key diff op: Missing key: " + key);
    }
  } else if (op === "replace") {
    if (!valueIn(key, keys)) {
      throw new Error("Invalid replace key diff op: Missing key: " + key);
    }
  } else if (op === "patch") {
    if (!valueIn(key, keys)) {
      throw new Error("Invalid patch key diff op: Missing key: " + key);
    }
  } else {
    throw new Error("Invalid op: " + op);
  }
}
