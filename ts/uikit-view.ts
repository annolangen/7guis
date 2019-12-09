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
  <form class="uk-form-horizontal">
    <div>
      <label class="uk-form-label">${label}</label>
      <div class="uk-form-controls">
        ${control}
      </div>
    </div>
  </form>
`;

const newCounter = (counter: Counter) => () =>
  labeledInput(
    counter.count,
    html`
      <button class="uk-button uk-button-primary" @click=${counter.incr}>
        Count
      </button>
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
        <input class="uk-input" .value=${value} @input=${oninput} />
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
      <div class="uk-form-controls">
        <select class="uk-select" @change=${typeChange}>
            <option>one-way flight</option>
            <option>return flight</option>
        </select>
      </div>
      <div class="uk-form-controls">
        <input
          class="uk-input"
          type="date"
          .value=${booker.outbound}
          @change=${outboundChange}
        />
      </div>
      <div class="uk-form-controls">
        <input
          class="uk-input"
          type="date"
          .value=${booker.back}
          @change=${returnChange}
          ?disabled=${booker.back === undefined}
        />
      </div>
      <div class="uk-form-controls">
        <button
          class="uk-button uk-button-primary"
          ?disabled=${booker.back !== undefined &&
            booker.back <= booker.outbound}
          @click=${bookClick}
        >
          Book
        </button>
      </div>
    </div>
    <p ?hidden=${!booker.booked}>
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
      ${[
        labeledInput(
          'Elapsed time',
          html`
            <progress
              class="uk-progress"
              value=${model.elapsed}
              max=${model.duration}
              style="width:100%"
            >
              Progress:
              ${Math.min(100, (100 * model.elapsed) / model.duration)}%
            </progress>
          `
        ),
        labeledInput(
          'Elapsed seconds',
          html`
            ${model.elapsed}
          `
        ),
        labeledInput(
          'Duration',
          html`
            <input
              class="uk-range"
              type="range"
              min="1"
              max="60"
              .value=${model.duration}
              @input=${durationChange}
            />
          `
        ),
      ]}
      <button class="uk-button uk-button-primary" @click=${model.reset}>
        Reset
      </div>
    `;
  };
}

function newCrud(model: Crud) {
  const firstInput = document.createElement('input');
  const lastInput = document.createElement('input');
  firstInput.type = 'text';
  firstInput.classList.add('uk-input');
  lastInput.type = 'text';
  lastInput.classList.add('uk-input');
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
          class="uk-input"
          .value=${model.prefix}
          @input=${prefixChange}
        />
      `
    )}
    <form class="uk-form">
      <div class="uk-form-controls">
        <select class="uk-select" size="5" @change=${selectionChange}>
          ${model.mapPrefixFiltered(
            (name, i) =>
              html`
                <option value=${i}>${name}</option>
              `
          )}
        </select>
      </div>
    </form>
    ${labeledInput(
      'Surname',
      html`
        <p class="uk-form-controls">${lastInput}</div>
      `
    )}
    ${labeledInput(
      'Name',
      html`
        <p class="uk-form-controls">${firstInput}</div>
      `
    )}
    <div>
      <button class="uk-button uk-button-primary" @click=${create}>
        Create
      </button>
      <button
        class="uk-button uk-button-primary"
        ?disabled=${model.selected === undefined}
        @click=${update}
      >
        Update
      </button>
      <button
        class="uk-button uk-button-primary"
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
        class="uk-button uk-button-primary"
        ?disabled=${!model.canUndo}
        @click=${model.undo}
      >
        Undo
      </button>
      <button
        class="uk-button uk-button-primary"
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
      #sheet .uk-table th {
        user-select: none;
        text-align: center;
      }
    </style>
    <div style="height:66ex;overflow:auto">
      <table id="sheet" class="uk-table" border>
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

const renderBody = () =>
  render(
    html`
        <ul class="uk-tab">
          <li class="uk-disabled">Examples</li>
          ${Object.entries(examples).map(
            ([k, { name }]) =>
              html`
                <li
                  class=${'#' + k === window.location.hash ? 'uk-active' : ''}
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
              <div ?hidden=${'#' + k !== window.location.hash}>
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
