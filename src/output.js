// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { NotifyUserError } from "./exceptions";
import { RenderableDiffModel } from "./renderable";
const TEXT_MIMETYPES = [
  "text/plain",
  "application/vnd.jupyter.stdout",
  "application/vnd.jupyter.stderr"
];

function isStream(output) {
  return output.output_type === "stream";
}

function isError(output) {
  return output.output_type === "error";
}

function isExecuteResult(output) {
  return output.output_type === "execute_result";
}

function isDisplayData(output) {
  return output.output_type === "display_data";
}

/**
 * Diff model for single cell output entries.
 *
 * Can converted to a StringDiffModel via the method `stringify()`, which also
 * takes an optional argument `key` which specifies a subpath of the IOutput to
 * make the model from.
 */
export class OutputDiffModel extends RenderableDiffModel {
  /**
   * Checks whether the given mimetype is present in the output's mimebundle.
   * If so, it returns the path/key to that mimetype's data. If not present,
   * it returns null.
   *
   * See also: innerMimeType
   */
  hasMimeType(mimetype) {
    let outputs = this.base || this.remote;
    if (isStream(outputs) && TEXT_MIMETYPES.indexOf(mimetype) !== -1) {
      return "text";
    } else if (isError(outputs)) {
      return "traceback";
    } else if (isExecuteResult(outputs) || isDisplayData(outputs)) {
      let data = outputs.data;
      if (mimetype in data) {
        return ["data", mimetype];
      }
    }
    return null;
  }
  /**
   * Returns the expected MIME type of the IOutput subpath specified by `key`,
   * as determined by the notebook format specification.
   *
   * Throws an error for unknown keys.
   *
   * See also: hasMimeType
   */
  innerMimeType(key) {
    let t = (this.base || this.remote).output_type;
    if (
      (t === "stream" && key === "text") ||
      (t === "error" && key === "traceback")
    ) {
      // TODO: 'application/vnd.jupyter.console-text'?
      return "text/plain";
    } else if (
      (t === "execute_result" || t === "display_data") &&
      Array.isArray(key)
    ) {
      return key[1];
    }
    throw new NotifyUserError("Unknown MIME type for key: " + key);
  }
  /**
   * Can be converted to a StringDiffModel via the method `stringify()`, which also
   * takes an optional argument `key` which specifies a subpath of the IOutput to
   * make the model from.
   */
  stringify(key) {
    let model = super.stringify(key);
    if (key) {
      model.mimetype = this.innerMimeType(key);
    }
    return model;
  }
}
/**
 * Function used to create a list of models for a list diff
 *
 * - If base and remote are both non-null and equal, it returns
 *   a list of models representing unchanged entries.
 * - If base and a diff is given, it ignores remote and returns
 *   a list of models representing the diff.
 * - If base is null, it returns a list of models representing
 *   added entries.
 * - If remote is null, it returns a list of models representing
 *   deleted entries.
 */
export function makeOutputModels(base, remote, diff) {
  let models = [];
  if (remote === null && !diff) {
    if (base === null) {
      throw new Error("Either base or remote need to be specififed!");
    }
    // Cell deleted
    for (let o of base) {
      models.push(new OutputDiffModel(o, null));
    }
  } else if (base === null) {
    if (remote === null) {
      throw new Error("Either base or remote need to be specififed!");
    }
    // Cell added
    for (let o of remote) {
      models.push(new OutputDiffModel(null, o));
    }
  } else if (remote === base) {
    // All entries unchanged
    for (let o of base) {
      models.push(new OutputDiffModel(o, o));
    }
  } else if (diff) {
    // Entries patched, remote will be null
    let consumed = 0;
    let skip = 0;
    for (let d of diff) {
      let index = d.key;
      for (let o of base.slice(consumed, index)) {
        // Add unchanged entries
        models.push(new OutputDiffModel(o, o));
      }
      if (d.op === "addrange") {
        // Entries added
        for (let o of d.valuelist) {
          models.push(new OutputDiffModel(null, o));
        }
        skip = 0;
      } else if (d.op === "removerange") {
        // Entries removed
        let len = d.length;
        for (let i = index; i < index + len; i++) {
          models.push(new OutputDiffModel(base[i], null));
        }
        skip = len;
      } else if (d.op === "patch") {
        // Entry changed
        models.push(new OutputDiffModel(base[index], null, d.diff));
        skip = 1;
      } else {
        throw new Error("Invalid diff operation: " + d);
      }
      consumed = Math.max(consumed, index + skip);
    }
    for (let o of base.slice(consumed)) {
      // Add unchanged entries
      models.push(new OutputDiffModel(o, o));
    }
  } else {
    throw new Error("Invalid arguments to makeOutputModels()");
  }
  return models;
}
