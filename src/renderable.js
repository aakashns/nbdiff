// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

import { Signal } from "./signal";
import { getSubDiffByKey } from "./diffutil";
import { patch } from "./patch";
import {
  createDirectStringDiffModel,
  createPatchStringDiffModel
} from "./string";
/**
 * Diff model for a renderable object (something that has an internal MimeBundle)
 *
 * Can be converted to a StringDiffModel via the method `stringify()`, which also
 * takes an optional argument `key` which specifies a subpath of the IOutput to
 * make the model from.
 */
export class RenderableDiffModel {
  constructor(base, remote, diff) {
    this.trustedChanged = new Signal(this);
    if (!remote && !base) {
      throw new Error("Either remote or base value need to be given");
    }
    this.base = base;
    if (!remote && diff) {
      this.remote = patch(base, diff);
    } else {
      this.remote = remote;
    }
    this.diff = diff || null;
    this.collapsible = false;
  }
  get unchanged() {
    return JSON.stringify(this.base) === JSON.stringify(this.remote);
  }
  get added() {
    return this.base === null;
  }
  get deleted() {
    return this.remote === null;
  }
  /**
   * Convert to a StringDiffModel.
   *
   * Takes an optional argument `key` which specifies a subpath of the MimeBundle to
   * make the model from.
   */
  stringify(key) {
    let getMemberByPath = function(obj, key, f) {
      if (!obj) {
        return obj;
      }
      if (Array.isArray(key)) {
        const tail = key.length > 2 ? key.slice(1) : key[1];
        if (f) {
          return getMemberByPath(f(obj, key[0]), tail, f);
        }
        return getMemberByPath(obj[key[0]], tail, f);
      } else if (f) {
        return f(obj, key);
      }
      return obj[key];
    };
    let base = key ? getMemberByPath(this.base, key) : this.base;
    let remote = key ? getMemberByPath(this.remote, key) : this.remote;
    let diff =
      this.diff && key
        ? getMemberByPath(this.diff, key, getSubDiffByKey)
        : this.diff;
    let model = null;
    if (this.unchanged || this.added || this.deleted || !diff) {
      model = createDirectStringDiffModel(base, remote);
    } else {
      model = createPatchStringDiffModel(base, diff);
    }
    model.mimetype = key ? this.innerMimeType(key) : "application/json";
    model.collapsible = this.collapsible;
    model.collapsibleHeader = this.collapsibleHeader;
    model.startCollapsed = this.startCollapsed;
    return model;
  }
  /**
   * Whether outputs are trusted
   */
  get trusted() {
    return this._trusted;
  }
  set trusted(value) {
    if (this._trusted !== value) {
      this._trusted = value;
      this.trustedChanged.emit(value);
    }
  }
  /**
   * The present values of model.base/remote
   */
  get contents() {
    let ret = [];
    if (this.base) {
      ret.push(this.base);
    }
    if (this.remote && this.remote !== this.base) {
      ret.push(this.remote);
    }
    return ret;
  }
}
