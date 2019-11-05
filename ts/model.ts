import { newSpreadsheet } from './spreadsheet';

export interface Counter {
  readonly count: number;
  incr(): void;
}

function newCounter() {
  let count = 0;
  return {
    get count() {
      return count;
    },
    incr: () => (count += 1),
  } as Counter;
}

export interface Converter {
  celsius: number;
  fahrenheit: number;
}

function newConverter() {
  let temp = 32; // in Fahrenheitn
  return {
    get celsius() {
      return Math.round((temp - 32) / 1.8);
    },
    set celsius(c: number) {
      temp = Math.round(c * 1.8 + 32);
    },
    get fahrenheit() {
      return temp;
    },
    set fahrenheit(f: number) {
      temp = f;
    },
  } as Converter;
}

// Invariants:
// (type == 'one-way flight') == (back == undefined)
// (type == 'return flight') == (back >= outbound)
export interface Booker {
  type: 'one-way flight' | 'return flight';
  outbound: string;
  back: string | undefined;
  booked: boolean;
}

function newBooker() {
  let type: 'one-way flight' | 'return flight' = 'one-way flight';
  let outbound = new Date().toISOString().substr(0, 10); // match yyyy-MM-dd format used by date input
  let back: string | undefined = undefined;
  const booked = false;

  function normalize() {
    if (type === 'one-way flight') {
      back = undefined;
    } else if (back === undefined || back < outbound) {
      back = outbound;
    }
  }

  return {
    get type() {
      return type;
    },
    set type(t: 'one-way flight' | 'return flight') {
      type = t;
      normalize();
    },
    get outbound() {
      return outbound;
    },
    set outbound(o: string) {
      outbound = o;
      normalize();
    },
    get back() {
      return back;
    },
    set back(b: string | undefined) {
      back = b;
      normalize();
    },
  } as Booker;
}

export interface Timer {
  readonly elapsed: number;
  duration: number;
  reset(): void;
}

function newTimer() {
  let elapsed = 0;
  let duration = 25;
  let timer: number | null = setInterval(tick, 100);
  function tick() {
    elapsed = Math.round(10 * elapsed + 1) / 10;
    normalize();
  }
  function normalize() {
    if (elapsed < duration) {
      if (!timer) {
        timer = setInterval(tick, 100);
      }
    } else {
      elapsed = duration;
      if (timer) {
        clearInterval(timer!);
        timer = null;
      }
    }
  }
  return {
    get elapsed() {
      return elapsed;
    },
    get duration() {
      return duration;
    },
    set duration(d: number) {
      duration = d;
      normalize();
    },
    reset() {
      elapsed = 0;
      normalize();
    },
  } as Timer;
}

export interface Crud {
  prefix: string;
  mapPrefixFiltered<T>(mapFn: (name: string, id: number) => T): T[];
  readonly selected: number | undefined;
  setSelected(i: number | undefined): { first: string; last: string };
  create(first: string, last: string): void;
  updateSelected(first: string, last: string): void;
  deleteSelected(): void;
}

function newCrud() {
  let prefix = '';
  let selected: number | undefined = undefined;
  const nameList = ['Emil, Hans', 'Mustermann, Max', 'Tisch, Roman'];
  function setSelected(i: number | undefined) {
    selected = i;
    if (i !== undefined) {
      const match = nameList[i].match('([^,]*), (.*)');
      if (match) {
        return { first: match[2], last: match[1] };
      }
    }
    return { first: '', last: '' };
  }
  return {
    get prefix() {
      return prefix;
    },
    set prefix(p: string) {
      prefix = p;
    },
    mapPrefixFiltered<T>(mapFn: (name: string, id: number) => T) {
      return prefix.length
        ? nameList.reduce(
            (p: T[], c, i) => (c.startsWith(prefix) ? [...p, mapFn(c, i)] : p),
            []
          )
        : nameList.map(mapFn);
    },
    get selected() {
      return selected;
    },
    setSelected,
    create(first: string, last: string) {
      selected = nameList.length;
      nameList.push(last + ', ' + first);
    },
    updateSelected: (first: string, last: string) =>
      (nameList[selected || 0] = last + ', ' + first),
    deleteSelected() {
      delete nameList[selected || 0];
      setSelected(undefined);
    },
  } as Crud;
}

export interface Circle {
  readonly x: number;
  readonly y: number;
  r: number;
}

export interface Circles {
  readonly circles: Circle[];
  readonly updating: number | undefined;
  push(circle: Circle): void;
  getCircleForUpdate(i: number): Circle;
  readonly canUndo: boolean;
  undo(): void;
  readonly canRedo: boolean;
  redo(): void;
}

interface State {
  circles: Circle[];
  updating?: number;
}

function newCircles() {
  let state: State = { circles: [] };
  const undo: State[] = [];
  const redo: State[] = [];
  return {
    get circles() {
      return state.circles;
    },
    get updating() {
      return state.updating;
    },
    push(circle: Circle) {
      undo.push(state);
      state = { circles: [...state.circles, circle] };
    },
    getCircleForUpdate(i: number) {
      undo.push(state);
      state = { ...state, updating: i };
      return state.circles[i];
    },
    get canUndo() {
      return undo.length > 0;
    },
    undo() {
      if (!undo.length) throw new Error('empty undo');
      redo.push(state);
      state = undo.pop() as State;
    },
    get canRedo() {
      return redo.length > 0;
    },
    redo() {
      if (!redo.length) throw new Error('empty redo');
      undo.push(state);
      state = redo.pop() as State;
    },
  } as Circles;
}

export const PAGE_MODEL = {
  counter: newCounter(),
  converter: newConverter(),
  booker: newBooker(),
  timer: newTimer(),
  crud: newCrud(),
  circles: newCircles(),
  cells: newSpreadsheet(),
};
