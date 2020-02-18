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
  <form>
    <div><label>${label}</label>${control}</div>
  </form>
`;

const newCounter = (counter: Counter) => () =>
  labeledInput(
    counter.count,
    html`
      <button class="btn--raised btn--primary" @click=${counter.incr}>
        Count
      </button>
    `
  );

function newConverter(converter: Converter) {
  function setCelsius(this: HTMLInputElement) {
    converter.celsius = Number(this.value);
  }
  function setFahrenheit(this: HTMLInputElement) {
    converter.fahrenheit = Number(this.value);
  }
  const li = (label: string, value: number, oninput: (e: InputEvent) => void) =>
    labeledInput(
      label,
      html`
        <input type="text" .value=${value} @input=${oninput} />
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
    <form>
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
          class="btn--raised btn--primary"
          ?disabled=${booker.back !== undefined &&
            booker.back <= booker.outbound}
          @click=${bookClick}
        >
          Book
        </button>
      </div>
    </div>
    <p class="card" ?hidden=${!booker.booked}>
      You have booked a ${type} on
      ${booker.outbound}${
    booker.back !== undefined ? ' returning on ' + booker.back : ''
  }.
    </p>
  `;
}

function newTimer(model: Timer) {
  let timer: number | null = null;
  function durationChange(this: HTMLInputElement) {
    model.duration = Number(this.value);
  }
  function row(label: string, value: TemplateResult | string | number) {
    return html`
      <div><label style="width:20%">${label}</label> ${value}</div>
    `;
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
      <table>
        ${[
          row(
            'Elapsed time',
            html`
              <progress value=${model.elapsed} max=${model.duration}>
                Progress:
                ${Math.min(100, (100 * model.elapsed) / model.duration)}%
              </progress>
            `
          ),
          row('Elapsed seconds', model.elapsed),
          row(
            'Duration',
            html`
              <input
                type="range"
                min="1"
                max="60"
                .value=${model.duration}
                @input=${durationChange}
              />
            `
          ),
        ]}
      </table>
      <button class="btn--raised btn--primary" @click=${model.reset}>
        Reset
      </button>
    `;
  };
}

function newCrud(model: Crud) {
  let surname = '';
  let name = '';
  function prefixChange(this: HTMLInputElement) {
    model.prefix = this.value;
  }
  function selectionChange(this: HTMLInputElement) {
    const { first, last } = model.setSelected(Number(this.value));
    surname = last;
    name = first;
  }
  function surnameInput(this: HTMLInputElement) {
    surname = this.value;
  }
  function nameInput(this: HTMLInputElement) {
    name = this.value;
  }
  function deleteSelected() {
    model.deleteSelected();
    surname = name = '';
  }
  const create = () => model.create(name, surname);
  const update = () => model.updateSelected(name, surname);
  return () => html`
    ${labeledInput(
      'Filter prefix',
      html`
        <input type="text" .value=${model.prefix} @input=${prefixChange} />
      `
    )}
    <form>
      <select size="5" @change=${selectionChange}>
        ${model.mapPrefixFiltered(
          (name, i) =>
            html`
              <option value=${i}>${name}</option>
            `
        )}
      </select>
    </form>
    ${labeledInput(
      'Surname',
      html`
        <input type="text" .value=${surname} @input=${surnameInput} />
      `
    )}
    ${labeledInput(
      'Name',
      html`
        <input type="text" .value=${name} @input=${nameInput} />
      `
    )}
    <div>
      <button class="btn--raised btn--primary" @click=${create}>
        Create
      </button>
      <button
        class="btn--raised btn--primary"
        ?disabled=${model.selected === undefined}
        @click=${update}
      >
        Update
      </button>
      <button
        class="btn--raised btn--primary"
        ?disabled=${model.selected === undefined}
        @click=${deleteSelected}
      >
        Delete
      </button>
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
        class="btn--raised btn--primary"
        ?disabled=${!model.canUndo}
        @click=${model.undo}
      >
        Undo
      </button>
      <button
        class="btn--raised btn--primary"
        ?disabled=${!model.canRedo}
        @click=${model.redo}
      >
        Redo
      </button>
    </div>
    <svg @click=${addCircle} style="border: 2px solid; width:100%; height:60ex">
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
      #sheet tr:first-child th {
        min-width: 6ch;
      }
      #sheet th {
        user-select: none;
        text-align: center;
      }
    </style>
    <div style="height:66ex;overflow:auto">
      <table id="sheet" border>
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
              <th>${i}</th>
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

function viewChange(this: HTMLInputElement) {
  window.location.href = '#' + this.value;
}

const renderBody = () =>
  render(
    html`
      <div class="card g--12 tabs tab-examples-name">
        <input type="radio" name="tabs" id="examples" disabled />
        <div class="tab-label-content" id="examples-content">
          <label for="examples">Examples</label>
        </div>
        ${Object.entries(examples).map(
          ([k, { name, render }]) =>
            html`
              <input
                type="radio"
                name="tabs"
                id=${k}
                .checked=${'#' + k === window.location.hash}
              />
              <div class="tab-label-content" id="${k}-content">
                <label for=${k}>${name}</label>
                <div class="tab-content">${render()}</div>
              </div>
            `
        )}
        <div class="slide slide-examples"></div>
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
