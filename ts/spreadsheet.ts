// Simple spreadsheet with columns A-Z and rows 0-99. Cells can be set
// to constant numbers or strings as well as formulas, which are
// indicated with a leading '='. Formula expressions can be cell
// references, numeric constants, or operators with formula expression
// arguments, or for sum and prod, rectangular regions.
export interface Spreadsheet {
  setCell(row: number, col: number, text: string): void;
  cell(row: number, col: number): string;
  value(row: number, col: number): string;
}

const ROW_COUNT = 100;
const COL_COUNT = 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
const CELL_COUNT = ROW_COUNT * COL_COUNT;
const REF_PATTERN = /^([a-z])([0-9][0-9]?)/i; // Cell references A0 to Z99
const BIN_OPS: {
  [key: string]: (x: number, y: number) => number;
} = {
  add: (x, y) => x + y,
  sub: (x, y) => x - y,
  div: (x, y) => x / y,
  mul: (x, y) => x * y,
};
const BIN_OP_PATTERN = /^(add|sub|div|mul)[(]/;
const RECT_OPS: {
  [key: string]: {op: (x: number, y: number) => number; init: number};
} = {
  sum: {op: (x, y) => x + y, init: 0},
  prod: {op: (x, y) => x * y, init: 1},
};
const RECT_OP_PATTERN = /^(sum|prod)[(]/;

// Evaluation obtains values for arguments for (row/col)
// positions. If there is a cycle, we detect it by incrementing
// depth every time we dereference.
interface Calculator {
  (depth: number): number;
}

interface Formula extends Calculator {
  displayString: string;
  value(): string; // Calculated value or displayString, if NaN
}

function newFormula(displayString: string, calc: Calculator) {
  const result = calc as Formula;
  result.displayString = displayString;
  result.value = () => {
    const v = calc(0);
    return isNaN(v) ? displayString : String(v);
  };
  return result;
}

function newConstant(text: string): Formula {
  const n = Number(text);
  return newFormula(text, () => n);
}

interface Parser {
  expr(): Calculator;
}

export function newSpreadsheet(): Spreadsheet {
  const cells: Formula[][] = Array.from({length: ROW_COUNT}, () =>
    Array(COL_COUNT).fill(newFormula('', () => NaN))
  );
  const deref = (row: number, col: number) => (depth: number) =>
    depth > CELL_COUNT ? NaN : cells[row][col](depth + 1);
  return {
    value: (row, col) => cells[row][col].value(),
    cell: (row, col) => cells[row][col].displayString,
    setCell: (row, col, text) =>
      (cells[row][col] = text.startsWith('=')
        ? newFormula(text, newParser(text.slice(1)).expr())
        : newConstant(text)),
  };

  function newParser(text: string): Parser {
    let pos = 0;

    // Throws syntax error unless the expected string is at the current position
    function match(expected: string) {
      while (text[pos] === ' ') pos++;
      if (text.slice(pos, pos + expected.length) !== expected) {
        throw new Error(`Parse error wanted ${expected} at ${pos} in ${text}.`);
      }
      pos += expected.length;
    }

    // Returns result of RegExp.exec and advances current position by match, if successful.
    function tryMatch(r: RegExp) {
      while (text[pos] === ' ') pos++;
      const match = r.exec(text.slice(pos));
      if (match) {
        pos += match[0].length;
      }
      return match;
    }
    const ref = (match: RegExpExecArray) => ({
      row: Number(match[2]),
      col: match[1].toUpperCase().charCodeAt(0) - 65,
    });

    function parseRef() {
      const match = tryMatch(REF_PATTERN);
      if (!match) {
        throw new Error('syntax error: expected reference');
      }
      return ref(match);
    }

    // Parses a rectangular region of cells, like `A0:B1`.
    function rect() {
      const first = parseRef();
      match(':');
      const second = parseRef();
      return {
        firstCol: Math.min(first.col, second.col),
        firstRow: Math.min(first.row, second.row),
        lastCol: Math.max(first.col, second.col),
        lastRow: Math.max(first.row, second.row),
      };
    }
    function expr(): Calculator {
      const refMatch = tryMatch(REF_PATTERN);
      if (refMatch) {
        const {row, col} = ref(refMatch);
        return deref(row, col);
      }
      const binOpMatch = tryMatch(BIN_OP_PATTERN);
      if (binOpMatch) {
        const first = expr();
        match(',');
        const second = expr();
        match(')');
        const op = BIN_OPS[binOpMatch[1]];
        return depth => op(first(depth), second(depth));
      }
      const rectOpMatch = tryMatch(RECT_OP_PATTERN);
      if (rectOpMatch) {
        const {firstCol, firstRow, lastCol, lastRow} = rect();
        match(')');
        const {op, init} = RECT_OPS[rectOpMatch[1]];
        return depth => {
          let result = init;
          for (let i = firstRow; i <= lastRow; i++) {
            for (let j = firstCol; j <= lastCol; j++) {
              const v = deref(i, j)(depth);
              if (!isNaN(v)) {
                result = op(result, v);
              }
            }
          }
          return result;
        };
      }
      const constMatch = tryMatch(/^[^ ,()]+/);
      if (!constMatch) return () => NaN;
      const n = Number(constMatch[0]);
      return () => n;
    }
    return {expr};
  }
}
