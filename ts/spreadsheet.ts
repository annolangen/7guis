// Simple spreadsheet with columns A-Z and rows 0-99. Cells can be set
// to constant numbers or strings as well as formulas, which are
// indicated with a leading '='. Formula expressions can be cell
// references, numeric constants, or operators with formula expression
// arguments, or for sum and prod, rectangular regions.
export interface Spreadsheet {
  setCell(row: number, col: number, cell: string): void;
  cell(row: number, col: number): string;
  value(row: number, col: number): string;
}

const ROW_COUNT = 100;
const COL_COUNT = 'Z'.charCodeAt(0) - 'A'.charCodeAt(0) + 1;
const CELL_COUNT = ROW_COUNT * COL_COUNT;
const REF_PATTERN = /^([a-z])([0-9][0-9]?)/i; // Cell references A0 to Z99
const OP_PATTERN = /^(sum|prod|add|sub|div|mul)[(]/;
const ALWAYS_NAN = (depth: number) => NaN;
const EMPTY_FORMULA: Formula = newFormula('', ALWAYS_NAN);

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

type Env = (row: number, col: number) => Calculator;

// Encapsulates position in text to be parsed.
interface ParseState {
  // Throws syntax error unless the expected string is at the current position
  match: (expected: string) => void;
  // Returns result of RegExp.exec and advances current position by match, if successful.
  tryMatch: (r: RegExp) => RegExpExecArray | null;
}

export function newSpreadsheet(): Spreadsheet {
  const cells: Formula[][] = Array.from({ length: ROW_COUNT }, (_, i) =>
    Array.from({ length: COL_COUNT }, (_, j) => EMPTY_FORMULA)
  );
  const deref = (row: number, col: number) => (depth: number) =>
    depth > CELL_COUNT ? NaN : cells[row][col](depth + 1);
  return {
    value: (row, col) => cells[row][col].value(),
    cell: (row, col) => cells[row][col].displayString,
    setCell: (row, col, cell) =>
      (cells[row][col] = cell.startsWith('=')
        ? newFormula(cell, parseExpr(newParseState(cell.substr(1)), deref))
        : parseConstant(cell)),
  };
}

function newFormula(displayString: string, calc: Calculator): Formula {
  const result = calc as Formula;
  result.displayString = displayString;
  result.value = () => toStringWithFallback(calc(0), displayString);
  return result;
}

const toStringWithFallback = (n: number, fallback: string) =>
  isNaN(n) ? fallback : String(n);

function parseExpr(expr: ParseState, env: Env): Calculator {
  const refMatch = expr.tryMatch(REF_PATTERN);
  if (refMatch) {
    const [row, col] = parseRef(refMatch);
    return env(row, col);
  }
  const opMatch = expr.tryMatch(OP_PATTERN);
  if (opMatch) {
    return ARG_PARSER_BY_OP[opMatch[1]](expr, env);
  }
  const constMatch = expr.tryMatch(/^[^ ,()]+/);
  if (!constMatch) {
    return ALWAYS_NAN;
  }
  const n = Number(constMatch[0]);
  return _ => n;
}

function parseRef(refMatch: RegExpExecArray | null): number[] {
  if (!refMatch) throw new Error('syntax error: expected reference');
  return [
    Number(refMatch[2]),
    refMatch[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0),
  ];
}

// Returns Formula with the given text as display string. The
// Formula's calculated value is the given text as a number if
// possible, NaN otherwise.
function parseConstant(text: string): Formula {
  const n = Number(text);
  return newFormula(text, _ => n);
}

const binOp = (op: (x: number, y: number) => number) => (
  args: ParseState,
  env: Env
): Calculator => {
  const [first, second] = parseTwoArgs(args, env);
  return depth => op(first(depth), second(depth));
};

const ARG_PARSER_BY_OP: {
  [key: string]: (args: ParseState, env: Env) => Calculator;
} = {
  sum,
  prod,
  add: binOp((x, y) => x + y),
  sub: binOp((x, y) => x - y),
  div: binOp((x, y) => x / y),
  mul: binOp((x, y) => x * y),
};

function sum(rect: ParseState, env: Env): Calculator {
  const argValues = rectValues(parseRect(rect, env));
  return depth => argValues(depth).reduce((a, n) => a + n, 0);
}

function prod(rect: ParseState, env: Env): Calculator {
  const argValues = rectValues(parseRect(rect, env));
  return depth => argValues(depth).reduce((a, n) => a * n, 1);
}

// Function returning a list of (non-NaN) numbers from the given calculators.
const rectValues = (rectCalculators: Calculator[]) => (depth: number) =>
  rectCalculators.map(f => f(depth)).filter(n => !isNaN(n));

function parseTwoArgs(args: ParseState, env: Env): Calculator[] {
  const first = parseExpr(args, env);
  if (!args.tryMatch(/^ *, */)) args.match(',');
  const second = parseExpr(args, env);
  if (!args.tryMatch(/^ *[)] */)) args.match(')');
  return [first, second];
}

function parseRect(rect: ParseState, env: Env): Calculator[] {
  const [ulRow, ulCol] = parseRef(rect.tryMatch(REF_PATTERN));
  rect.match(':');
  const [lrRow, lrCol] = parseRef(rect.tryMatch(REF_PATTERN));
  if (!rect.tryMatch(/^ *[)] */)) rect.match(')');
  const h = lrRow - ulRow + 1;
  const w = lrCol - ulCol + 1;
  return Array.from({ length: h }, (_, i) => ulRow + i).reduce(
    (acc: Calculator[], i) =>
      acc.concat(Array.from({ length: w }, (_, j) => env(i, j))),
    []
  );
}

function newParseState(text: string): ParseState {
  let pos = 0;
  function match(expected: string) {
    if (text.substr(pos, expected.length) === expected) {
      pos += expected.length;
    } else {
      throw new Error(`Parse error wanted ${expected} at ${text.substr(pos)}`);
    }
  }
  function tryMatch(r: RegExp) {
    const match = r.exec(text.substr(pos));
    if (match) {
      pos += match[0].length;
    }
    return match;
  }
  return { match, tryMatch };
}
