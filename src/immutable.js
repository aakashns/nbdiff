// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

/**
 * Standard implementation of the IStringDiffModel interface.
 */
export class ImmutableDiffModel {
  /**
   * ImmutableDiffModel constructor.
   *
   * `collapsible` and `collapsed` both defaults to false.
   */
  constructor(base, remote, collapsible, header, collapsed) {
    this.base = base;
    this.remote = remote;
    this.collapsible = collapsible === true;
    if (this.collapsible) {
      this.collapsibleHeader = header ? header : "";
      this.startCollapsed = collapsed === true;
    }
  }
  get unchanged() {
    return this.base === this.remote;
  }
  get added() {
    return this.base === undefined;
  }
  get deleted() {
    return this.remote === undefined;
  }
}
/**
 * Create an ImmutableDiffModel from a base value, a remote value, and a single diff entry.
 *
 * Note: The requirement of a single diff entry means it will not support
 * an add/replace pair on the same key, as this should instead be represented
 * by a 'replace' op.
 *
 * @export
 * @param {(ImmutableValue | undefined)} base : The base value
 * @param {(IDiffImmutableObjectEntry | null)} diff : The diff entry, or null if unchanged
 * @returns {ImmutableDiffModel}
 */
export function createImmutableModel(base, remote, diff) {
  if (!diff) {
    return new ImmutableDiffModel(base, remote);
  } else if (diff.op === "add") {
    if (base !== undefined) {
      throw new Error("Invalid diff op on immutable value");
    }
    return new ImmutableDiffModel(base, diff.value);
  } else if (diff.op === "remove") {
    if (base === undefined) {
      throw new Error("Invalid diff op on immutable value");
    }
    return new ImmutableDiffModel(base, undefined);
  } else {
    // diff.op === 'replace'
    if (base === undefined) {
      throw new Error("Invalid diff op on immutable value");
    }
    return new ImmutableDiffModel(base, diff.value);
  }
}
