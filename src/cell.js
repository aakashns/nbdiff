import { getSubDiffByKey, getDiffEntryByKey } from "./diffutil";
import {
  createDirectStringDiffModel,
  createPatchStringDiffModel,
  setMimetypeFromCellType
} from "./string";
import { makeOutputModels } from "./output";
import { createImmutableModel } from "./immutable";
import { NotifyUserError } from "./exceptions";

function isCode(cell) {
  return cell.cell_type === "code";
}

export class CellDiffModel {
  constructor(source, metadata, outputs, executionCount, cellType) {
    this.source = source;
    this.metadata = metadata;
    this.outputs = outputs;
    this.executionCount = executionCount;
    this.cellType = cellType;
    if (outputs === null && cellType === "code") {
      throw new NotifyUserError("Invalid code cell, missing outputs!");
    }
    this.metadata.collapsible = true;
    this.metadata.collapsibleHeader = "Metadata changed";
    this.metadata.startCollapsed = true;
  }

  get unchanged() {
    let unchanged = this.source.unchanged;
    unchanged = unchanged && (this.metadata ? this.metadata.unchanged : true);
    if (this.outputs) {
      for (let o of this.outputs) {
        unchanged = unchanged && o.unchanged;
      }
    }
    if (this.executionCount) {
      // TODO: Ignore if option 'ignore minor' set?
      unchanged = unchanged && this.executionCount.unchanged;
    }
    return unchanged;
  }

  get added() {
    return this.source.added;
  }

  get deleted() {
    return this.source.deleted;
  }

  getChunkedOutputs() {
    if (this.outputs === null) {
      return null;
    }
    const chunks = [];
    if (this.added || this.deleted) {
      // Should not chunk outputs for added/deleted cells
      // simply make one element chunks:
      for (let o of this.outputs) {
        chunks.push([o]);
      }
    } else {
      let currentChunk = [];
      for (let o of this.outputs) {
        if (o.added || o.deleted) {
          currentChunk.push(o);
        } else {
          if (currentChunk.length) {
            chunks.push(currentChunk);
          }
          chunks.push([o]);
          currentChunk = [];
        }
      }
      if (currentChunk.length) {
        chunks.push(currentChunk);
      }
    }
    return chunks;
  }
}
export function createPatchedCellDiffModel(base, diff, nbMimetype) {
  let source = null;
  let metadata = null;
  let outputs = null;
  let executionCount = null;
  let subDiff = getSubDiffByKey(diff, "source");
  if (subDiff) {
    source = createPatchStringDiffModel(base.source, subDiff);
  } else {
    source = createDirectStringDiffModel(base.source, base.source);
  }
  setMimetypeFromCellType(source, base, nbMimetype);
  subDiff = getSubDiffByKey(diff, "metadata");
  metadata = subDiff
    ? createPatchStringDiffModel(base.metadata, subDiff)
    : createDirectStringDiffModel(base.metadata, base.metadata);
  if (isCode(base)) {
    let outputsBase = base.outputs;
    let outputsDiff = getSubDiffByKey(diff, "outputs");
    if (outputsDiff) {
      // Outputs patched
      outputs = makeOutputModels(outputsBase, null, outputsDiff);
    } else {
      // Outputs unchanged
      outputs = makeOutputModels(outputsBase, outputsBase);
    }
    let execBase = base.execution_count;
    let execDiff = getDiffEntryByKey(diff, "execution_count");
    // Pass base as remote, which means fall back to unchanged if no diff:
    executionCount = createImmutableModel(execBase, execBase, execDiff);
  }
  return new CellDiffModel(
    source,
    metadata,
    outputs,
    executionCount,
    base.cell_type
  );
}
export function createUnchangedCellDiffModel(base, nbMimetype) {
  let source = createDirectStringDiffModel(base.source, base.source);
  setMimetypeFromCellType(source, base, nbMimetype);
  let metadata = createDirectStringDiffModel(base.metadata, base.metadata);
  let outputs = null;
  let executionCount = null;
  if (isCode(base)) {
    outputs = makeOutputModels(base.outputs, base.outputs);
    let execBase = base.execution_count;
    executionCount = createImmutableModel(execBase, execBase);
  } else {
    // markdown or raw cell
  }
  return new CellDiffModel(
    source,
    metadata,
    outputs,
    executionCount,
    base.cell_type
  );
}
export function createAddedCellDiffModel(remote, nbMimetype) {
  let source = createDirectStringDiffModel(null, remote.source);
  setMimetypeFromCellType(source, remote, nbMimetype);
  let metadata = createDirectStringDiffModel(null, remote.metadata);
  let outputs = null;
  let executionCount = null;
  if (isCode(remote)) {
    outputs = makeOutputModels(null, remote.outputs);
    executionCount = createImmutableModel(null, remote.execution_count);
  }
  return new CellDiffModel(
    source,
    metadata,
    outputs,
    executionCount,
    remote.cell_type
  );
}
export function createDeletedCellDiffModel(base, nbMimetype) {
  let source = createDirectStringDiffModel(base.source, null);
  setMimetypeFromCellType(source, base, nbMimetype);
  let metadata = createDirectStringDiffModel(base.metadata, null);
  let outputs = null;
  let executionCount = null;
  if (isCode(base)) {
    outputs = makeOutputModels(base.outputs, null);
    let execBase = base.execution_count;
    executionCount = createImmutableModel(execBase, null);
  }
  return new CellDiffModel(
    source,
    metadata,
    outputs,
    executionCount,
    base.cell_type
  );
}
