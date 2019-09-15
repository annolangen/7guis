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
const REF_PATTERN = /^([a-z])([0-9][0-9]?)/i;
const OP_PATTERN = /^(sum|prod|add|sub|div|mul)[(]/;

type ValueProviderList = Array<(depth: number) => number>;

export function newSpreadsheet(): Spreadsheet {
  const cells = Array.from({ length: ROW_COUNT }, (_, i) =>
    Array.from({ length: COL_COUNT }, (_, j) => emptyFormula)
  );
  const toStringWithFallback = (n: number, fallback: string) =>
    isNaN(n) ? fallback : String(n);
  const formulaValue = (f: Formula) =>
    toStringWithFallback(f.eval(0), f.displayString);
  const parseCell = (cell: string) =>
    cell.startsWith('=')
      ? parseExpr(newParseState(cell.substr(1)))
      : parseConstant(cell);
  const rectValues = (args: ValueProviderList) => (depth: number) =>
    args.map(f => f(depth)).filter(n => !isNaN(n));
  const binOp = (op: (x: number, y: number) => number) => (
    displayString: string,
    args: ParseState
  ) => {
    const [first, second] = parseTwoArgs(args);
    return newFormula(displayString, depth =>
      op(first.eval(depth), second.eval(depth))
    );
  };
  const argParserByOp: {
    [key: string]: (displayString: string, args: ParseState) => Formula;
  } = {
    sum,
    prod,
    add: binOp((x, y) => x + y),
    sub: binOp((x, y) => x - y),
    div: binOp((x, y) => x / y),
    mul: binOp((x, y) => x * y),
  };
  function sum(displayString: string, rect: ParseState) {
    const argValues = rectValues(parseRect(rect));
    return newFormula(displayString, depth =>
      argValues(depth).reduce((a, n) => a + n, 0)
    );
  }
  function prod(displayString: string, rect: ParseState) {
    const argValues = rectValues(parseRect(rect));
    return newFormula(displayString, depth =>
      argValues(depth).reduce((a, n) => a * n, 1)
    );
  }
  function parseExpr(expr: ParseState): Formula {
    const refMatch = expr.lookingAt(REF_PATTERN);
    if (refMatch) {
      const [row, col] = parseRef(refMatch, expr);
      return newFormula(refMatch[0], depth => cells[row][col].eval(depth + 1));
    }
    const opMatch = expr.lookingAt(OP_PATTERN);
    if (opMatch) {
      expr.match(opMatch[0]);
      const argParser = argParserByOp[opMatch[1]];
      // TODO fix displayString for nested expressions.
      return argParser(expr.text, expr);
    }
    const constMatch = expr.lookingAt(/^[^ ,()]+/);
    if (constMatch) {
      expr.match(constMatch[0]);
      return parseConstant(constMatch[0]);
    }
    return emptyFormula;
  }
  function parseRef(
    refMatch: RegExpExecArray | null,
    ref: ParseState
  ): number[] {
    if (!refMatch) throw new Error('syntax error: expected reference');
    ref.match(refMatch[0]);
    return [
      Number(refMatch[2]),
      refMatch[1].toUpperCase().charCodeAt(0) - 'A'.charCodeAt(0),
    ];
  }
  function parseTwoArgs(args: ParseState): Formula[] {
    const first = parseExpr(args);
    const commaMatch = args.lookingAt(/ *, */);
    args.match(commaMatch ? commaMatch[0] : ',');
    const second = parseExpr(args);
    args.match(')');
    return [first, second];
  }
  function parseRect(rect: ParseState): ValueProviderList {
    const [ulRow, ulCol] = parseRef(rect.lookingAt(REF_PATTERN), rect);
    rect.match(':');
    const [lrRow, lrCol] = parseRef(rect.lookingAt(REF_PATTERN), rect);
    rect.match(')');
    const h = lrRow - ulRow + 1;
    const w = lrCol - ulCol + 1;
    return Array.from({ length: h }, (_, i) => ulRow + i).reduce(
      (acc: ValueProviderList, i) =>
        acc.concat(
          Array.from({ length: w }, (_, j) => (depth: number) =>
            cells[i][j].eval(depth)
          )
        ),
      []
    );
  }
  function parseConstant(text: string): Formula {
    const n = Number(text);
    return newFormula(text, _ => n);
  }
  return {
    value: (row, col) => formulaValue(cells[row][col]),
    cell: (row, col) => cells[row][col].displayString,
    setCell: (row, col, cell) => (cells[row][col] = parseCell(cell)),
  };
}

interface Formula {
  displayString: string;
  // Evaluation obtains values for arguments for (row/col)
  // positions. If there is a cycle, we detect it by incrementing
  // depth every time we dereference through the environment.
  eval(depth: number): number;
}
const newFormula = (
  displayString: string,
  calc: (depth: number) => number
): Formula => ({
  displayString,
  eval: depth => (depth > CELL_COUNT ? NaN : calc(depth)),
});
const emptyFormula: Formula = {
  displayString: '',
  eval: depth => NaN,
};

interface ParseState {
  text: string;
  pos: () => number;
  match: (expected: string) => void;
  lookingAt: (r: RegExp) => RegExpExecArray | null;
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
  return {
    text,
    match,
    pos: () => pos,
    lookingAt: r => r.exec(text.substr(pos)),
  };
}
