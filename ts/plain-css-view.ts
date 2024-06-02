import {html, render, svg} from 'lit-html';
import {Spreadsheet} from './spreadsheet';
import {
  PAGE_MODEL,
  Counter,
  Converter,
  Booker,
  Timer,
  Crud,
  Circles,
  Circle,
} from './model';

const newCounter = (counter: Counter) => () => html`
  <form>
    <label>
      ${counter.count}
      <button @click=${counter.incr}>Count</button>
    </label>
  </form>
`;

function newConverter(converter: Converter) {
  function setCelsius(this: HTMLInputElement) {
    converter.celsius = Number(this.value);
  }
  function setFahrenheit(this: HTMLInputElement) {
    converter.fahrenheit = Number(this.value);
  }
  return () => html`
    <form>
      <label>
        Celsius:
        <input .value="${converter.celsius}" @input=${setCelsius} />
      </label>
      <label>
        Fahrenheit:
        <input .value="${converter.fahrenheit}" @input=${setFahrenheit} />
      </label>
    </form>
  `;
}

function newBooker(booker: Booker) {
  let type = 'one-way flight';
  function typeChange(this: HTMLInputElement) {
    type = this.value;
    booker.back = type === 'return flight' ? '' : undefined;
  }
  function outboundChange(this: HTMLInputElement) {
    booker.outbound = this.value;
  }
  function returnChange(this: HTMLInputElement) {
    booker.back = this.value;
  }
  const bookClick = () => (booker.booked = true);
  return () => html`
    <form style="width:fit-content">
      <fieldset>
        <select @change=${typeChange}>
          <option>one-way flight</option>
          <option>return flight</option>
        </select>
        <input
          type="date"
          .value=${booker.outbound}
          @change=${outboundChange}
        />
        <input
          type="date"
          .value=${booker.back}
          @change=${returnChange}
          ?disabled=${booker.back === undefined}
        />
        <button
          ?disabled=${booker.back !== undefined &&
          booker.back <= booker.outbound}
          @click=${bookClick}
        >
          Book
        </button>
      </fieldset>
    </form>
    <div ?hidden=${!booker.booked}>
      You have booked a ${type} on
      ${booker.outbound}${booker.back !== undefined
        ? ' returning on ' + booker.back
        : ''}.
    </div>
  `;
}

function newTimer(model: Timer) {
  let timer: number | NodeJS.Timeout | null = null;
  function durationChange(this: HTMLInputElement) {
    model.duration = Number(this.value);
  }
  return () => {
    if (model.elapsed < model.duration) {
      if (!timer) timer = setInterval(renderBody, 100);
    } else {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }
    return html`
      <table id="nIwUX">
        <style>
          #nIwUX td {
            padding: 0.5em 1em;
            text-align: right;
          }
          #nIwUX td:last-child {
            width: 20em;
          }
          #nIwUX progress,
          #nIwUX input {
            width: 100%;
          }
        </style>
        <tr>
          <td>Elapsed time</td>
          <td>
            <progress value=${model.elapsed} max=${model.duration}>
              Progress:
              ${Math.min(100, (100 * model.elapsed) / model.duration)}%
            </progress>
          </td>
        </tr>
        <tr>
          <td>Elapsed seconds</td>
          <td style="text-align:left">${model.elapsed}</td>
        </tr>
        <tr>
          <td>Duration</td>
          <td>
            <input
              type="range"
              min="1"
              max="60"
              .value="${model.duration}"
              @input=${durationChange}
            />
          </td>
        </tr>
      </table>

      <button @click=${model.reset}>Reset</button>
    `;
  };
}

function newCrud(model: Crud) {
  const firstInput = document.createElement('input');
  const lastInput = document.createElement('input');
  firstInput.type = 'text';
  lastInput.type = 'text';
  function prefixChange(this: HTMLInputElement) {
    model.prefix = this.value;
  }
  function selectionChange(this: HTMLInputElement) {
    setSelected(Number(this.value));
  }
  function setSelected(i: number | undefined) {
    const {first, last} = model.setSelected(i);
    lastInput.value = last;
    firstInput.value = first;
  }
  function deleteSelected() {
    model.deleteSelected();
    lastInput.value = '';
    firstInput.value = '';
  }
  const create = () => model.create(firstInput.value, lastInput.value);
  const update = () => model.updateSelected(firstInput.value, lastInput.value);
  return () => html`
    <form id="jm4Ad" style="display:flex;flex-direction:column">
      <style>
        #jm4Ad label,
        #jm4Ad button {
          margin: 0.5em 0.25em;
        }
      </style>
      <label>
        Filter prefix:
        <input type="text" .value=${model.prefix} @input=${prefixChange} />
      </label>
      <div style="display:flex">
        <select size="5" @change=${selectionChange}>
          ${model.mapPrefixFiltered(
            (name, i) => html` <option value=${i}>${name}</option> `
          )}
        </select>
        <span style="display:flex;flex-direction:column">
          <label>Surname: ${lastInput}</label>
          <label style="text-align:right">Name: ${firstInput}</label>
        </span>
      </div>
      <div>
        <button @click=${create}>Create</button>
        <button ?disabled=${model.selected === undefined} @click=${update}>
          Update
        </button>
        <button
          ?disabled=${model.selected === undefined}
          @click=${deleteSelected}
        >
          Delete
        </button>
      </div>
    </form>
  `;
}

function newCircles(model: Circles) {
  function adjustRadius(this: HTMLInputElement) {
    model.updating!.r = Number(this.value);
  }
  const radiusControl = ({x, y, r}: Circle) => html`
    <p>
      <label>Adjust radius of circle at (${x}, ${y}):</label>
      <input type="range" @input=${adjustRadius} .value=${r} />
    </p>
  `;
  function newCircle(this: SVGElement, e: MouseEvent) {
    const svg = this.getBoundingClientRect();
    model.addCircle({x: e.x - svg.left, y: e.y - svg.top, r: 20});
  }
  return () => html`
    <div style="content-align:center">
      <button ?disabled=${!model.canUndo} @click=${model.undo}>Undo</button>
      <button ?disabled=${!model.canRedo} @click=${model.redo}>Redo</button>
    </div>
    <svg @click=${newCircle} style="border: 2px solid; width:100%; height:60ex">
      ${model.circles.map(
        (c, index) =>
          svg`
          <circle cx=${c.x} cy=${c.y} r=${c.r} 
            style="fill:${
              c === model.updating ? 'grey' : 'transparent'
            };stroke-width: 1;stroke: black;transition: fill 0.2s ease 0s;"
             @click=${(e: MouseEvent) => {
               model.setCircleForUpdate(index);
               e.stopPropagation(); // lest we also create a new circle
               renderBody();
             }}>
          </circle>`
      )}
    </svg>
    ${model.updating === undefined ? html`` : radiusControl(model.updating)}
  `;
}

function newCells(sheet: Spreadsheet) {
  let selected: {i: number; j: number} | undefined = undefined;
  const editableCell = document.createElement('td');
  editableCell.contentEditable = 'true';
  editableCell.addEventListener('keydown', keydown);
  const hookByKey: {[key: string]: (i: number, j: number) => void} = {
    Enter: () => (selected = undefined),
    ArrowRight: (_, j) => j < 26 && (selected!.j += 1),
    ArrowLeft: (_, j) => j > 0 && (selected!.j -= 1),
    ArrowUp: i => i > 0 && (selected!.i -= 1),
    ArrowDown: i => i < 99 && (selected!.i += 1),
  };
  function keydown(this: HTMLTableDataCellElement, ev: KeyboardEvent) {
    if (selected) {
      const hook = hookByKey[ev.key];
      if (hook) {
        const {i, j} = selected!;
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
      #sheet table,
      #sheet td,
      #sheet th {
        border: 1px solid #cbcbcb;
        border-collapse: collapse;
        padding: 0.5em;
      }
      #sheet th {
        min-width: 6ch;
      }
      #sheet td:first-child,
      #sheet tr:first-child {
        background-color: #f7f7f7;
        user-select: none;
        text-align: center;
        min-width: 3ch;
      }
    </style>
    <div id="sheet" style="height: 66ex;overflow:auto">
      <table>
        <tr>
          <th style="min-width:1ch"></th>
          ${Array.from(
            {length: 26},
            (_, i) => html` <th>${String.fromCharCode(65 + i)}</th> `
          )}
        </tr>
        ${Array.from(
          {length: 100},
          (_, i) => html`
            <tr>
              <td><b>${i}</b></td>
              ${Array.from({length: 26}, (_, j) => {
                return selected && selected.i === i && selected.j === j
                  ? editableCell
                  : html`
                      <td
                        @click=${() => {
                          selected = {i, j};
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
    <p>
      Click inside a cell to edit its content. Hit enter to apply. Click outside
      the cell or hit escape to abort. Here are some example contents: '5.5',
      'Some text', '=A1', '=sum(B2:C4)', '=div(C1, 5)'.
    </p>
  `;
}

const examples = {
  counter: {name: 'Counter', render: newCounter(PAGE_MODEL.counter)},
  converter: {
    name: 'Temperature Converter',
    render: newConverter(PAGE_MODEL.converter),
  },
  booker: {name: 'Flight Booker', render: newBooker(PAGE_MODEL.booker)},
  timer: {name: 'Timer', render: newTimer(PAGE_MODEL.timer)},
  crud: {name: 'CRUD', render: newCrud(PAGE_MODEL.crud)},
  drawer: {name: 'Circle Drawer', render: newCircles(PAGE_MODEL.circles)},
  cells: {name: 'Cells', render: newCells(PAGE_MODEL.cells)},
};

const renderBody = () =>
  render(
    html`
      <div id="rAbTk" style="display:flex">
        <style>
          #rAbTk > * {
            padding: 0.5em 1em;
          }
        </style>
        <span>Examples</span>
        ${Object.entries(examples).map(
          ([k, {name}]) => html`<a href="#${k}"> ${name} </a>`
        )}
      </div>
      <p></p>
      <div style="margin:0 auto; max-width:48em">
        ${Object.entries(examples).map(
          ([k, {render}]) =>
            html`<div ?hidden=${'#' + k !== window.location.hash}>
              ${render()}
            </div>`
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
