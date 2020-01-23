const fireEvent = (node, type, detail, options) => {
  options = options || {};
  detail = detail === null || detail === undefined ? {} : detail;
  const event = new Event(type, {
    bubbles: options.bubbles === undefined ? true : options.bubbles,
    cancelable: Boolean(options.cancelable),
    composed: options.composed === undefined ? true : options.composed,
  });
  event.detail = detail;
  node.dispatchEvent(event);
  return event;
};

if (!customElements.get("ha-switch") && customElements.get("paper-toggle-button")) {
  customElements.define("ha-switch", customElements.get("paper-toggle-button"));
}

const LitElement = Object.getPrototypeOf(customElements.get("hui-view"));
const html = LitElement.prototype.html;
const css = LitElement.prototype.css;

export class VasttrafikCardEditor extends LitElement {
  setConfig(config) {
    this._config = config;
  }

  static get properties() {
    return { hass: {}, _config: {} };
  }

  get _entities() {
    return this._config.entities || [];
  }

  get _title() {
    return this._config.title || "";
  }

  render() {
    if (!this.hass) {
      return html``;
    }

    const entities = Object.keys(this.hass.states).filter(
      (eid) => {
        const state = this.hass.states[eid];
        const attribution = state.attributes.attribution;
        return !!attribution && attribution.toLowerCase().includes('västtrafik');
      }
    );

    return html`
      <div class="card-config">
        <div>
          <paper-input
            label="Title"
            .value="${this._title}"
            .configValue="${"title"}"
            @value-changed="${this._valueChanged}"
          ></paper-input>
          <div class="entities">
            ${this._entities().map((entityConf, index) => {
              return html`
                <div class="entity">
                  <ha-entity-picker
                    .hass="${this.hass}"
                    .value="${entityConf.entity}"
                    .index="${index}"
                    @change="${this._valueChanged}"
                    allow-custom-entity
                  ></ha-entity-picker>
                  <paper-icon-button
                    title="Move entity down"
                    icon="hass:arrow-down"
                    .index="${index}"
                    @click="${this._entityDown}"
                    ?disabled="${index === this._entities().length - 1}"
                  ></paper-icon-button>
                  <paper-icon-button
                    title="Move entity up"
                    icon="hass:arrow-up"
                    .index="${index}"
                    @click="${this._entityUp}"
                    ?disabled="${index === 0}"
                  ></paper-icon-button>
                </div>
              `;
            })}
            <ha-entity-picker
              .hass="${this.hass}"
              @change="${this._addEntity}"
            ></ha-entity-picker>
          </div>
        </div>
      </div>
    `;
  }

  _addEntity(ev) {
    const target = ev.target;
    if (target.value === "") {
      return;
    }
    const newConfigEntities = this.entities!.concat({
      entity: target.value as string,
    });
    target.value = "";
    fireEvent(this, "entities-changed", { entities: newConfigEntities });
  }

  _entityUp(ev) {
    const target = ev.target;
    const newEntities = this.entities.concat();

    [newEntities[target.index - 1], newEntities[target.index]] = [
      newEntities[target.index],
      newEntities[target.index - 1],
    ];

    fireEvent(this, "entities-changed", { entities: newEntities });
  }

  _entityDown(ev) {
    const target = ev.target;
    const newEntities = this.entities.concat();

    [newEntities[target.index + 1], newEntities[target.index]] = [
      newEntities[target.index],
      newEntities[target.index + 1],
    ];

    fireEvent(this, "entities-changed", { entities: newEntities });
  }

  _valueChanged(ev) {
    if (!this._config || !this.hass) {
      return;
    }
    const target = ev.target;
    if (this[`_${target.configValue}`] === target.value) {
      return;
    }
    if (target.configValue) {
      if (target.value === "") {
        delete this._config[target.configValue];
      } else {
        this._config = {
          ...this._config,
          [target.configValue]:
            target.checked !== undefined ? target.checked : target.value,
        };
      }
    }
    fireEvent(this, "config-changed", { config: this._config });
  }

  static get styles() {
    return css`
      .entities {
        padding-left: 20px;
      }
      .entity {
        display: flex;
        align-items: flex-end;
      }
      .entity ha-entity-picker {
        flex-grow: 1;
      }
    `;
  }
}

customElements.define("vasttrafik-card-editor", VasttrafikCardEditor);