import {
  html,
  render,
  svg,
  TemplateResult,
} from '../node_modules/lit-html/lit-html';
import { newSpreadsheet, Spreadsheet } from './spreadsheet';
import { styleMap } from '../node_modules/lit-html/directives/style-map.js';
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

const labeledInput = (label: string | number, control: TemplateResult) => html`
  <div class="field is-horizontal">
    <div class="field-label is-normal">
      <label class="label">${label}</label>
    </div>
    <div class="field-body">
      <div class="field">
        <p class="control">
          ${control}
        </p>
      </div>
    </div>
  </div>
`;

const newCounter = (counter: Counter) => () =>
  labeledInput(
    counter.count,
    html`
      <button class="button is-link" @click=${counter.incr}>Count</button>
    `
  );

function newConverter(converter: Converter) {
  function setCelsius(this: HTMLInputElement) {
    converter.celsius = Number(this.value);
  }
  function setFahrenheit(this: HTMLInputElement) {
    converter.fahrenheit = Math.round(Number(this.value) * 1.8 + 32);
  }
  const li = (label: string, value: number, oninput: (e: InputEvent) => void) =>
    labeledInput(
      label,
      html`
        <input class="input" .value=${value} @input=${oninput} />
      `
    );
  return () => html`
    ${li('Celsius', converter.celsius, setCelsius)}
    ${li('Fahrenheit', converter.fahrenheit, setFahrenheit)}
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
    <div class="field is-grouped is-grouped-multiline">
      <div class="control">
        <div class="select">
          <select class="input" @change=${typeChange}>
            <option>one-way flight</option>
            <option>return flight</option>
          </select>
        </div>
      </div>
      <div class="control">
        <input
          class="input"
          type="date"
          .value=${booker.outbound}
          @change=${outboundChange}
        />
      </div>
      <div class="control">
        <input
          class="input"
          type="date"
          .value=${booker.back}
          @change=${returnChange}
          ?disabled=${booker.back === undefined}
        />
      </div>
      <div class="control">
        <button
          class="button is-link"
          ?disabled=${booker.back !== undefined &&
            booker.back <= booker.outbound}
          @click=${bookClick}
        >
          Book
        </button>
      </div>
    </div>
    <div style="display:${booker.booked ? 'block' : 'none'}">
      You have booked a ${type} on
      ${booker.outbound}${booker.back !== undefined
        ? ' returning on ' + booker.back
        : ''}.
    </div>
  `;
}

function newTimer(model: Timer) {
  let timer: number | null = null;
  function durationChange(this: HTMLInputElement) {
    model.duration = Number(this.value);
  }
  return () => {
    if (timer) {
      if (model.elapsed >= model.duration) {
        clearInterval(timer);
        timer = null;
      }
    } else {
      if (model.elapsed < model.duration) {
        timer = setInterval(renderBody, 100);
      }
    }
    return html`
      <style>
        #timer td {padding: 0.5em 1em}
        #timer td:first-child {text-align: right}
      </style>
      <table id="timer">
        <tr>
          <td>Elapsed time</td>
          <td>
            <progress class="progress is-link" value=${model.elapsed} 
            max=${model.duration} style="width:100%">
              Progress:
              ${Math.min(100, (100 * model.elapsed) / model.duration)}%
            </progress>
          </td>
        </tr>
        <tr>
          <td>Elapsed seconds</td>
          <td>${model.elapsed}</td>
        </tr>
        <tr>
          <td>Duration</td>
          <td>
          <div class="field"><div class="control">
            <input 
              type="range"
              min="1"
              max="60"
              .value=${model.duration}
              @input=${durationChange}
            /></div></div>
          </td>
        </tr>
      </table>

      <button class="button is-link" @click=${model.reset}>
        Reset
      </div>
    `;
  };
}

function newCrud(model: Crud) {
  const firstInput = document.createElement('input');
  const lastInput = document.createElement('input');
  firstInput.type = 'text';
  firstInput.classList.add('input');
  lastInput.type = 'text';
  lastInput.classList.add('input');
  function prefixChange(this: HTMLInputElement) {
    model.prefix = this.value;
  }
  function selectionChange(this: HTMLInputElement) {
    setSelected(Number(this.value));
  }
  function setSelected(i: number | undefined) {
    const { first, last } = model.setSelected(i);
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
    ${labeledInput(
      'Filter prefix',
      html`
        <input
          type="text"
          class="input"
          .value=${model.prefix}
          @input=${prefixChange}
        />
      `
    )}
    <div class="field">
      <div class="control">
        <div class="select" style="height:auto;width:100%">
          <select
            style="height:auto;width:100%"
            size="5"
            @change=${selectionChange}
          >
            ${model.mapPrefixFiltered(
              (name, i) =>
                html`
                  <option value=${i}>${name}</option>
                `
            )}
          </select>
        </div>
      </div>
    </div>
    ${labeledInput(
      'Surname',
      html`
        <p class="control">${lastInput}</div>
      `
    )}
    ${labeledInput(
      'Name',
      html`
        <p class="control">${firstInput}</div>
      `
    )}
    <div class="field is-grouped is-grouped-multiline">
      <div class="control">
        <button class="button is-link" @click=${create}>Create</button>
      </div>
      <div class="control">
        <button
          class="button is-link"
          ?disabled=${model.selected === undefined}
          @click=${update}
        >
          Update
        </button>
      </div>
      <div class="control">
        <button
          class="button is-link"
          ?disabled=${model.selected === undefined}
          @click=${deleteSelected}
        >
          Delete
        </button>
      </div>
    </div>
  `;
}

function newCircles(model: Circles) {
  function adjustRadius(this: HTMLInputElement) {
    model.updating!.r = Number(this.value);
  }
  const radiusControl = ({ x, y, r }: Circle) => html`
    <div>Adjust radius of circle at (${x}, ${y})</div>
    <div class="field">
      <div class="control">
        <input type="range" @input=${adjustRadius} .value=${r} />
      </div>
    </div>
  `;
  function addCircle(this: SVGElement, e: MouseEvent) {
    const svg = this.getBoundingClientRect();
    model.addCircle({ x: e.x - svg.left, y: e.y - svg.top, r: 20 });
  }
  return () => html`
    <div style="content-align:center">
      <button
        class="button is-link"
        ?disabled=${!model.canUndo}
        @click=${model.undo}
      >
        Undo
      </button>
      <button
        class="button is-link"
        ?disabled=${!model.canRedo}
        @click=${model.redo}
      >
        Redo
      </button>
    </div>
    <svg @click=${addCircle} style="border: 2px solid;">
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
    ${model.updating === undefined ? '' : radiusControl(model.updating)}
  `;
}

function newCells(sheet: Spreadsheet) {
  let selected: { i: number; j: number } | undefined = undefined;
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
        min-width: 6ch;
      }
      #sheet td:first-child,
      #sheet tr:first-child {
        user-select: none;
        text-align: center;
      }
    </style>
    <div class="table-container" style="height:66ex;overflow:auto">
      <table id="sheet" class="table is-bordered">
        <tr>
          <th style="min-width:1ch"></th>
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
      Click inside a cell to edit its content. Hit enter to apply. Click outside
      the cell or hit escape to abort. Here are some example contents: '5.5',
      'Some text', '=A1', '=sum(B2:C4)', '=div(C1, 5)'.
    </span>
  `;
}

const examples = {
  counter: { name: 'Counter', render: newCounter(PAGE_MODEL.counter) },
  converter: {
    name: 'Temperature Converter',
    render: newConverter(PAGE_MODEL.converter),
  },
  booker: { name: 'Flight Booker', render: newBooker(PAGE_MODEL.booker) },
  timer: { name: 'Timer', render: newTimer(PAGE_MODEL.timer) },
  crud: { name: 'CRUD', render: newCrud(PAGE_MODEL.crud) },
  drawer: { name: 'Circle Drawer', render: newCircles(PAGE_MODEL.circles) },
  cells: { name: 'Cells', render: newCells(PAGE_MODEL.cells) },
};

const renderBody = () =>
  render(
    html`
      <div class="tabs is-boxed">
        <ul>
          <li>Examples</li>
          ${Object.entries(examples).map(
            ([k, { name }]) =>
              html`
                <li
                  class=${'#' + k === window.location.hash ? 'is-active' : ''}
                >
                  <a href="#${k}">${name}</a>
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
