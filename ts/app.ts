import { html, render, svg } from '../node_modules/lit-html/lit-html';
import { newSpreadsheet } from './spreadsheet';
import { styleMap } from '../node_modules/lit-html/directives/style-map.js';

function newCounter() {
  let count = 0;
  return () => html`
    <form class="pure-form">
      <label>${count}</label>
      <div class="pure-button pure-button-primary" @click=${() => (count += 1)}>
        Count
      </div>
    </form>
  `;
}

function newConverter() {
  let temp = 32; // in Fahrenheit
  function fahrenheitInput(this: HTMLInputElement) {
    temp = Number(this.value);
  }
  function celsiusInput(this: HTMLInputElement) {
    temp = Math.round(Number(this.value) * 1.8 + 32);
  }
  return () => html`
    <form class="pure-form">
      <input
        id="celsius"
        .value="${Math.round((temp - 32) / 1.8)}"
        @input=${celsiusInput}
      />
      <label for="celsius">Celsius =</label>
      <input id="fahrenheit" .value="${temp}" @input=${fahrenheitInput} />
      <label for="fahrenheit">Fahrenheit</label>
    </form>
  `;
}

function newBooker() {
  let flightType = 'one-way flight';
  let out = new Date().toISOString().substr(0, 10); // match yyyy-MM-dd format used by date input
  let back = out;
  let booked = false;
  function typeChange(this: HTMLInputElement) {
    flightType = this.value;
  }
  function outboundChange(this: HTMLInputElement) {
    out = this.value;
  }
  function returnChange(this: HTMLInputElement) {
    back = this.value;
  }
  const bookClick = () => (booked = true);
  return () => html`
    <form class="pure-form">
      <fieldset class="pure-group">
        <select class="pure-input-1-4" @change=${typeChange}>
          <option>one-way flight</option>
          <option>return flight</option>
        </select>
        <input
          class="pure-input-1-4"
          type="date"
          .value=${out}
          @change=${outboundChange}
        />
        <input
          class="pure-input-1-4"
          type="date"
          .value=${back}
          @change=${returnChange}
          ?disabled=${flightType === 'one-way flight'}
        />
        <div
          class="pure-button pure-button-primary pure-input-1-4"
          ?disabled=${flightType !== 'one-way flight' && back <= out}
          @click=${bookClick}
        >
          Book
        </div>
      </fieldset>
    </form>
    <div style="display:${booked ? 'block' : 'none'}">
      You have booked a ${flightType} on
      ${out}${flightType !== 'one-way flight' ? ' returning on ' + back : ''}.
    </div>
  `;
}

function newTimer() {
  let elapsed = 0;
  let duration = 25;
  let timer: number | null = setInterval(tick, 100);
  function tick() {
    if (elapsed < duration) {
      elapsed = Math.round(10 * elapsed + 1) / 10;
    } else {
      elapsed = duration;
      clearInterval(timer!);
      timer = null;
    }
    renderBody();
  }
  function durationChange(this: HTMLInputElement) {
    duration = Number(this.value);
  }

  function reset() {
    elapsed = 0;
    if (!timer) {
      timer = setInterval(tick, 100);
    }
  }
  return () => html`
    <style>
      td {
        padding: 0.5em 1em;
      }
    </style>
    <table>
      <tr>
        <td style="text-align:right">Elapsed time</td>
        <td style="width:20em">
          <progress value=${elapsed} max=${duration} style="width:100%">
            Progress: ${Math.min(100, (100 * elapsed) / duration)}%
          </progress>
        </td>
      </tr>
      <tr>
        <td style="text-align:right">Elapsed seconds</td>
        <td>${elapsed}</td>
      </tr>
      <tr>
        <td style="text-align:right">Duration</td>
        <td>
          <input
            type="range"
            min="1"
            max="60"
            .value="${duration}"
            style="width:100%"
            @input=${durationChange}
          />
        </td>
      </tr>
    </table>

    <div class="pure-button pure-button-primary" @click=${reset}>Reset</div>
  `;
}

function newCrud() {
  let prefix = '';
  let selected: number | undefined = undefined;
  const nameList = ['Emil, Hans', 'Mustermann, Max', 'Tisch, Roman'];
  const first = document.createElement('input');
  const last = document.createElement('input');
  first.type = 'text';
  last.type = 'text';
  function prefixChange(this: HTMLInputElement) {
    prefix = this.value;
  }
  function selectionChange(this: HTMLInputElement) {
    selected = Number(this.value);
    const match = nameList[selected].match('([^,]*), (.*)');
    if (match) {
      last.value = match[1];
      first.value = match[2];
    }
  }
  function resetSelection() {
    selected = undefined;
    last.value = '';
    first.value = '';
  }
  function create() {
    nameList.push(last.value + ', ' + first.value);
    resetSelection();
  }
  const update = () =>
    (nameList[selected || 0] = last.value + ', ' + first.value);
  function Delete() {
    delete nameList[selected || 0];
    resetSelection();
  }
  return () => html`
    <form class="pure-form pure-form-aligned">
      <div>
        <label>Filter prefix:</label>
        <input type="text" .value=${prefix} @input=${prefixChange} />
      </div>
      <div>
        <select size="2" style="height:100px" @change=${selectionChange}>
          ${nameList.map((name, i) =>
            !prefix.length || name.startsWith(prefix)
              ? html`
                  <option value=${i}>${name}</option>
                `
              : html``
          )}
        </select>
        <fieldset style="display:inline-block;vertical-align:middle;">
          <div class="pure-control-group"><label>Surname:</label>${last}</div>
          <div class="pure-control-group"><label>Name:</label>${first}</div>
        </fieldset>
      </div>
      <div>
        <span class="pure-button pure-button-primary" @click=${create}
          >Create</span
        >
        <span
          class="pure-button pure-button-primary"
          ?disabled=${selected === undefined}
          @click=${update}
          >Update</span
        >
        <span
          class="pure-button pure-button-primary"
          ?disabled=${selected === undefined}
          @click=${Delete}
          >Delete</span
        >
      </div>
    </form>
  `;
}

interface Circle {
  x: number;
  y: number;
  r: number;
}

type State = Circle[];

function newCircles() {
  let state: State = [];
  let selected: number | undefined = undefined;
  const undo: State[] = [];
  const redo: State[] = [];
  function newCircle(this: SVGElement, e: MouseEvent) {
    undo.push(state);
    selected = undefined;
    const svg = this.getBoundingClientRect();
    state = [...state, { x: e.x - svg.left, y: e.y - svg.top, r: 20 }];
  }
  function adjustRadius(this: HTMLInputElement) {
    state[selected!].r = Number(this.value);
  }
  function selectHandler(index: number) {
    return selectCircle;
    function selectCircle(this: SVGCircleElement, e: MouseEvent) {
      selected = index;
      undo.push(state);
      // New state with fresh copy of selected circle
      state = [...state];
      state[selected] = { ...state[selected] };
      e.stopPropagation(); // prevent creating a new circle in addition
      renderBody();
    }
  }
  function Undo() {
    redo.push(state);
    state = undo.pop() as State;
  }
  function Redo() {
    undo.push(state);
    state = redo.pop() as State;
  }
  function advanceState(nextState: State) {
    undo.push(state);
    state = nextState;
    renderBody();
  }
  const radiusControl = ({ x, y, r }: Circle) => html`
    <div class="pure-form">
      <label>Adjust radius of circle at (${x}, ${y}):</label>
      <input type="range" @input=${adjustRadius} .value=${r} />
    </div>
  `;
  return () => html`
    <div style="content-align:center">
      <span
        class="pure-button pure-button-primary"
        ?disabled=${!undo.length}
        @click=${Undo}
        >Undo</span
      >
      <span
        class="pure-button pure-button-primary"
        ?disabled=${!redo.length}
        @click=${Redo}
        >Redo</span
      >
    </div>
    <svg @click=${newCircle} style="border: 2px solid;">
      ${state.map(
        ({ x, y, r }, index) =>
          svg`
          <circle cx=${x} cy=${y} r=${r} 
            style="fill:${
              index === selected ? 'grey' : 'transparent'
            };stroke-width: 1;stroke: black;transition: fill 0.2s ease 0s;"
             data-index=${index}
             @click=${selectHandler(index)}>
          </circle>`
      )}
    </svg>
    ${selected === undefined ? '' : radiusControl(state[selected])}
  `;
}

function newCells() {
  let selected: { i: number; j: number } | undefined = undefined;
  const sheet = newSpreadsheet();
  const editableCell = document.createElement('td');
  editableCell.contentEditable = 'true';
  editableCell.addEventListener('keydown', keydown);
  const hookByKey: { [key: string]: (i: number, j: number) => void } = {
    Enter: (i, j) => (selected = undefined),
    ArrowRight: (i, j) => j < 26 && (selected!.j += 1),
    ArrowLeft: (i, j) => j > 0 && (selected!.j -= 1),
    ArrowUp: (i, j) => i > 0 && (selected!.i -= 1),
    ArrowDown: (i, j) => i < 99 && (selected!.i += 1),
  };
  function keydown(this: HTMLTableDataCellElement, ev: KeyboardEvent) {
    if (selected) {
      const hook = hookByKey[ev.key];
      if (hook) {
        const { i, j } = selected!;
        sheet.setCell(i, j, this.innerText);
        hook(i, j);
        renderBody();
        if (selected) {
          editableCell.innerText = sheet.cell(selected.i, selected.j);
          editableCell.focus();
        }
      }
    }
  }
  return () => html`
    <style>
      #sheet th {
        min-width: 64px;
        border: 1px solid #cbcbcb;
      }
      #sheet td:first-child,
      #sheet tr:first-child {
        background-color: #f7f7f7;
        user-select: none;
        text-align: center;
      }
    </style>
    <div style="height: 30em;overflow:auto">
      <table id="sheet" class="pure-table pure-table-bordered">
        <tr>
          <th style="min-width:30px"></th>
          ${Array.from(
            { length: 26 },
            (_, i) =>
              html`
                <th>${String.fromCharCode(65 + i)}</th>
              `
          )}
        </tr>
        ${Array.from(
          { length: 100 },
          (_, i) => html`
            <tr>
              <td><b>${i}</b></td>
              ${Array.from({ length: 26 }, (_, j) => {
                return selected && selected.i === i && selected.j === j
                  ? editableCell
                  : html`
                      <td
                        @click=${(e: MouseEvent) => {
                          selected = { i, j };
                          editableCell.innerText = sheet.cell(i, j);
                          renderBody();
                          editableCell.focus();
                        }}
                      >
                        ${sheet.value(i, j)}
                      </td>
                    `;
              })}
            </tr>
          `
        )}
      </table>
    </div>
    <span>
      Click inside a cell to edit its content.Hit enter to apply. Click outside
      the cell or hit escape to abort. Here are some example contents: '5.5',
      'Some text', '=A1', '=sum(B2:C4)', '=div(C1, 5)'.
    </span>
  `;
}

const examples = {
  counter: { name: 'Counter', render: newCounter() },
  converter: { name: 'Temperature Converter', render: newConverter() },
  booker: { name: 'Flight Booker', render: newBooker() },
  timer: { name: 'Timer', render: newTimer() },
  crud: { name: 'CRUD', render: newCrud() },
  drawer: { name: 'Circle Drawer', render: newCircles() },
  cells: { name: 'Cells', render: newCells() },
};

const renderBody = () =>
  render(
    html`
      <div
        class="pure-menu-scrollable pure-menu-horizontal"
        style="height:32px;background-color:blanchedalmond"
      >
        <div class="pure-menu-heading">Examples</div>
        <ul class="pure-menu-list">
          ${Object.entries(examples).map(
            ([k, { name }]) =>
              html`
                <li class="pure-menu-item">
                  <a href="#${k}" class="pure-menu-link">${name}</a>
                </li>
              `
          )}
        </ul>
      </div>
      <p></p>
      <div
        style="margin-left:auto; margin-right:auto; max-width:48em; color:#777"
      >
        ${Object.entries(examples).map(
          ([k, { render }]) =>
            html`
              <div
                style="${styleMap(
                  '#' + k === window.location.hash ? {} : { display: 'none' }
                )}"
              >
                ${render()}
              </div>
            `
        )}
      </div>
    `,
    document.body
  );

if (!window.location.hash) {
  window.location.hash = 'counter';
}
renderBody();
window.addEventListener('change', renderBody);
window.addEventListener('click', renderBody);
window.addEventListener('hashchange', renderBody);
window.addEventListener('input', renderBody);
