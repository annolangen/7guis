import { html, render, svg } from '../node_modules/lit-html/lit-html';
import { newSpreadsheet } from './spreadsheet';
import { styleMap } from '../node_modules/lit-html/directives/style-map.js';

function newCounter() {
  let count = 0;
  function click() {
    count += 1;
    renderBody();
  }
  return () => html`
    <form class="pure-form">
      <label>${count}</label>
      <div class="pure-button pure-button-primary" @click=${click}>Count</div>
    </form>
  `;
}

function newConverter() {
  let temp = 32; // in Fahrenheit
  function fahrenheitInput(e: InputEvent) {
    temp = Number(e.target.value);
    renderBody();
  }
  function celsiusInput(e: InputEvent) {
    temp = Math.round(Number(e.target.value) * 1.8 + 32);
    renderBody();
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
  function typeChange(e: InputEvent) {
    flightType = e.target.value;
    renderBody();
  }
  function outboundChange(e: InputEvent) {
    out = e.target.value;
    renderBody();
  }
  function returnChange(e: InputEvent) {
    back = e.target.value;
    renderBody();
  }
  function bookClick() {
    booked = true;
    renderBody();
  }
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
          .value=${out}
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
  function durationChange(e: InputEvent) {
    duration = Number(e.target.value);
    renderBody();
  }
  function reset() {
    elapsed = 0;
    if (!timer) {
      timer = setInterval(tick, 100);
    }
    renderBody();
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
        <td style="border: 1px;border-style: solid;width:20em">
          <div
            style="height: 16px;background:teal;width:${Math.min(
              100,
              (100 * elapsed) / duration
            )}%"
          ></div>
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
  function prefixChange(e: InputEvent) {
    prefix = e.target.value;
    renderBody();
  }
  function selectionChange(e: InputEvent) {
    selected = Number(e.target.value);
    const match = nameList[selected].match('([^,]*), (.*)');
    last.value = match[1];
    first.value = match[2];
    renderBody();
  }
  function resetSelectionAndRender() {
    selected = undefined;
    last.value = '';
    first.value = '';
    renderBody();
  }
  function create() {
    nameList.push(last.value + ', ' + first.value);
    resetSelectionAndRender();
  }
  function update() {
    nameList[selected] = last.value + ', ' + first.value;
    renderBody();
  }
  function Delete() {
    delete nameList[selected];
    resetSelectionAndRender();
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

interface State {
  circles: Circle[];
}

function newCircles() {
  let state: State = { circles: [] };
  const undo: State[] = [];
  const redo: State[] = [];
  function Undo() {
    redo.push(state);
    state = undo.pop();
    renderBody();
  }
  function Redo() {
    undo.push(state);
    state = redo.pop();
    renderBody();
  }
  function advanceState(nextState: State) {
    undo.push(state);
    state = nextState;
    renderBody();
  }

  let selected: number | undefined = undefined;
  function selectCircle(this: SVGCircleElement, e: MouseEvent) {
    selected = Number(this.dataset.index);
    undo.push(state);
    // New state with fresh copy of selected circle
    state = { circles: [...state.circles] };
    state.circles[selected] = { ...state.circles[selected] };
    e.stopPropagation();
    renderBody();
  }
  function adjustRadius(this: HTMLInputElement, e: InputEvent) {
    state.circles[selected!].r = Number(this.value);
    renderBody();
  }
  function newCircle(this: SVGElement, e: MouseEvent) {
    if (selected !== undefined) {
      undo.push(state);
      selected = undefined;
    }
    const svg = this.getBoundingClientRect();
    advanceState({
      circles: [
        ...state.circles,
        { x: e.x - svg.left, y: e.y - svg.top, r: 20 },
      ],
    });
  }
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
      ${state.circles.map(
        ({ x, y, r }, index) =>
          svg`
          <circle cx=${x} cy=${y} r=${r} 
            style="fill:${
              index === selected ? 'grey' : 'transparent'
            };stroke-width: 1;stroke: black;transition: fill 0.2s ease 0s;"
             data-index=${index}
             @click=${selectCircle}>
          </circle>`
      )}
    </svg>
    ${(({ x, y, r, display }) => html`
      <div class="pure-form" style="display:${display}">
        <label>Adjust radius of circle at (${x}, ${y}):</label>
        <input type="range" @input=${adjustRadius} .value=${r} />
      </div>
    `)(
      selected === undefined
        ? { x: 0, y: 0, r: 0, display: 'none' }
        : { ...state.circles[selected], display: 'block' }
    )}
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
    <div style="height: 30em;overflow:auto">
      <table class="pure-table pure-table-bordered">
        <tr style="background: rgb(246, 246, 246); user-select: none;">
          <th style="min-width:30px"></th>
          ${Array.from(
            { length: 26 },
            (_, i) => html`
              <th style="min-width:64px; border: 1px solid rgb(187, 187, 187);">
                ${String.fromCharCode(65 + i)}
              </th>
            `
          )}
        </tr>
        ${Array.from(
          { length: 100 },
          (_, i) => html`
            <tr>
              <td
                style="background: rgb(246, 246, 246); border: 1px solid rgb(187, 187, 187); user-select: none; text-align: center;"
              >
                <b>${i}</b>
              </td>
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
      Click inside a cell to edit its content. Hit enter to apply. Click outside
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
window.addEventListener('hashchange', renderBody);
