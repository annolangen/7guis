import { html, render, svg } from '../node_modules/lit-html/lit-html';
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

const newCounter = (counter: Counter) => () => html`
  <form class="pure-form">
    <label>${counter.count}</label>
    <div class="pure-button pure-button-primary" @click=${counter.incr}>
      Count
    </div>
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
    <form class="pure-form">
      <input id="celsius" .value="${converter.celsius}" @input=${setCelsius} />
      <label for="celsius">Celsius =</label>
      <input
        id="fahrenheit"
        .value="${converter.fahrenheit}"
        @input=${setFahrenheit}
      />
      <label for="fahrenheit">Fahrenheit</label>
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
    <form class="pure-form">
      <fieldset class="pure-group">
        <select class="pure-input-1-4" @change=${typeChange}>
          <option>one-way flight</option>
          <option>return flight</option>
        </select>
        <input
          class="pure-input-1-4"
          type="date"
          .value=${booker.outbound}
          @change=${outboundChange}
        />
        <input
          class="pure-input-1-4"
          type="date"
          .value=${booker.back}
          @change=${returnChange}
          ?disabled=${booker.back === undefined}
        />
        <div
          class="pure-button pure-button-primary pure-input-1-4"
          ?disabled=${booker.back !== undefined &&
            booker.back <= booker.outbound}
          @click=${bookClick}
        >
          Book
        </div>
      </fieldset>
    </form>
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
        td {
          padding: 0.5em 1em;
        }
      </style>
      <table>
        <tr>
          <td style="text-align:right">Elapsed time</td>
          <td style="width:20em">
            <progress
              value=${model.elapsed}
              max=${model.duration}
              style="width:100%"
            >
              Progress:
              ${Math.min(100, (100 * model.elapsed) / model.duration)}%
            </progress>
          </td>
        </tr>
        <tr>
          <td style="text-align:right">Elapsed seconds</td>
          <td>${model.elapsed}</td>
        </tr>
        <tr>
          <td style="text-align:right">Duration</td>
          <td>
            <input
              type="range"
              min="1"
              max="60"
              .value="${model.duration}"
              style="width:100%"
              @input=${durationChange}
            />
          </td>
        </tr>
      </table>

      <div class="pure-button pure-button-primary" @click=${model.reset}>
        Reset
      </div>
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
    <form class="pure-form pure-form-aligned">
      <div>
        <label>Filter prefix:</label>
        <input type="text" .value=${model.prefix} @input=${prefixChange} />
      </div>
      <div>
        <select size="2" style="height:100px" @change=${selectionChange}>
          ${model.mapPrefixFiltered(
            (name, i) =>
              html`
                <option value=${i}>${name}</option>
              `
          )}
        </select>
        <fieldset style="display:inline-block;vertical-align:middle;">
          <div class="pure-control-group">
            <label>Surname:</label>${lastInput}
          </div>
          <div class="pure-control-group">
            <label>Name:</label>${firstInput}
          </div>
        </fieldset>
      </div>
      <div>
        <span class="pure-button pure-button-primary" @click=${create}
          >Create</span
        >
        <span
          class="pure-button pure-button-primary"
          ?disabled=${model.selected === undefined}
          @click=${update}
          >Update</span
        >
        <span
          class="pure-button pure-button-primary"
          ?disabled=${model.selected === undefined}
          @click=${deleteSelected}
          >Delete</span
        >
      </div>
    </form>
  `;
}

function newCircles(model: Circles) {
  function adjustRadius(this: HTMLInputElement) {
    model.updating!.r = Number(this.value);
  }
  const radiusControl = ({ x, y, r }: Circle) => html`
    <div class="pure-form">
      <label>Adjust radius of circle at (${x}, ${y}):</label>
      <input type="range" @input=${adjustRadius} .value=${r} />
    </div>
  `;
  function newCircle(this: SVGElement, e: MouseEvent) {
    const svg = this.getBoundingClientRect();
    model.addCircle({ x: e.x - svg.left, y: e.y - svg.top, r: 20 });
  }
  return () => html`
    <div style="content-align:center">
      <span
        class="pure-button pure-button-primary"
        ?disabled=${!model.canUndo}
        @click=${model.undo}
        >Undo</span
      >
      <span
        class="pure-button pure-button-primary"
        ?disabled=${!model.canRedo}
        @click=${model.redo}
        >Redo</span
      >
    </div>
    <svg @click=${newCircle} style="border: 2px solid;">
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
