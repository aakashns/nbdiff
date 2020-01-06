// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.
import { valueIn } from "./util";

export function Pos(line, ch, sticky = null) {
  if (!(this instanceof Pos)) return new Pos(line, ch, sticky);
  this.line = line;
  this.ch = ch;
  this.sticky = sticky;
}

/**
 * Represents a range in a diff (typically in a string), in absolute indices (1D)
 */
export class DiffRangeRaw {
  /**
   * Create a new range [from, to = from + length)
   */
  constructor(from, length, source) {
    this.from = from;
    this.to = from + length;
    this.source = source;
  }
  /**
   * Change both `from` and `to` fields by the given offset
   */
  offset(offset) {
    this.from += offset;
    this.to += offset;
  }
}
/**
 * Class representing a string (diff) range in the format of
 * CodeMirror.Positions. Mainly makes sense for string diffs.
 *
 * The class also has fields to ease chunking of diffs without reparsing the
 * text.
 */
export class DiffRangePos {
  /**
   * Create a diff range. The `ch` field of the `to` position is defined as
   * non-inclusive, i.e., it follows the syntax of String.slice().
   */
  constructor(from, to, chunkStartLine, endsOnNewline) {
    this.from = from;
    this.to = to;
    this.chunkStartLine = chunkStartLine === true;
    this.endsOnNewline = endsOnNewline === true;
  }
}
/**
 * Utility function to find the line number of a given string index,
 * given the positions of all newlines.
 */
function findLineNumber(nlPos, index) {
  if (nlPos.length === 0) {
    return 0;
  }
  let lineNo = null;
  nlPos.some(function(el, i) {
    if (el >= index) {
      lineNo = i;
      return true;
    }
    return false;
  });
  if (lineNo === null) {
    return nlPos.length;
  }
  return lineNo;
}
/**
 * Function to convert an array of DiffRangeRaw to DiffRangePos. The
 * `text` parameter is the text in which the ranges exist.
 */
export function raw2Pos(raws, text) {
  // Find all newline's indices in text
  let adIdx = [];
  let i = -1;
  while (-1 !== (i = text.indexOf("\n", i + 1))) {
    adIdx.push(i);
  }
  let result = [];
  // Find line numbers from raw index
  for (let r of raws) {
    // First `from` position:
    let line = findLineNumber(adIdx, r.from);
    let lineStartIdx = line > 0 ? adIdx[line - 1] + 1 : 0;
    let from = Pos(line, r.from - lineStartIdx);
    // Then `to` position:
    line = findLineNumber(adIdx, r.to - 1); // `to` is non-inclusive
    lineStartIdx = line > 0 ? adIdx[line - 1] + 1 : 0;
    let to = Pos(line, r.to - lineStartIdx);
    // Finally, add some chunking hints:
    let startsOnNewLine = valueIn(r.from, adIdx);
    let endsOnNewline = valueIn(r.to - 1, adIdx); // non-inclusive
    let firstLineNew =
      from.ch === 0 &&
      (from.line !== to.line || endsOnNewline || r.to === text.length);
    let chunkFirstLine =
      firstLineNew ||
      !startsOnNewLine ||
      // Neither preceding nor following character is a newline
      (!valueIn(r.from - 1, adIdx) && !valueIn(r.to, adIdx));
    let pos = new DiffRangePos(from, to, chunkFirstLine, endsOnNewline);
    pos.source = r.source;
    result.push(pos);
  }
  return result;
}
