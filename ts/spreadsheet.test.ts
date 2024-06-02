import {newSpreadsheet} from './spreadsheet';

describe('App', () => {
  const ss = newSpreadsheet();
  it('stores string constants', () => {
    ss.setCell(0, 0, 'foo');
    expect(ss.cell(0, 0)).toBe('foo');
    expect(ss.value(0, 0)).toBe('foo');
  });
  it('stores numeric constants', () => {
    ss.setCell(0, 0, '7');
    expect(ss.cell(0, 0)).toBe('7');
    expect(ss.value(0, 0)).toBe('7');
  });
  it('evaluates formulas', () => {
    ss.setCell(0, 0, '=add(1, 1)');
    expect(ss.value(0, 0)).toBe('2');
    ss.setCell(0, 0, '=add(add(1, 1), 1)');
    expect(ss.value(0, 0)).toBe('3');
  });
  it('treats cycles as NaN', () => {
    ss.setCell(0, 0, '=A1');
    ss.setCell(0, 1, '=A0');
    expect(ss.value(0, 0)).toBe('=A1');
    expect(ss.value(0, 1)).toBe('=A0');
  });
  it('can reference cells', () => {
    ss.setCell(0, 0, '41');
    ss.setCell(1, 0, '=add(A0, 1)');
    expect(ss.value(1, 0)).toBe('42');
  });
  it('sums up rectangles, skipping NaN', () => {
    ss.setCell(0, 0, '1');
    ss.setCell(0, 1, '1');
    ss.setCell(1, 0, 'Total');
    ss.setCell(1, 1, '1');
    ss.setCell(0, 2, '=sum(A0:B1)');
    expect(ss.value(0, 2)).toBe('3');
  });
});
