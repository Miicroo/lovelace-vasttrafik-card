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

const arrayMove = (arr, fromIndex, toIndex) => {
    const element = arr[fromIndex];
    const newArray = arr.slice();
    newArray.splice(fromIndex, 1);
    newArray.splice(toIndex, 0, element);
    return newArray;
}

customElements.whenDefined('card-tools').then(() => {
    const ct = customElements.get('card-tools');

    class VasttrafikCardEditor extends ct.LitElement {

        static get properties() {
            return {
                hass: {},
                config: {}
            };
        }

        setConfig(config) {
            this._config = Object.assign({}, config);
            this._config.entities = this._parseEntities(config.entities);
        }

        _parseEntities(configuredEntities) {
            return configuredEntities.map(entity => {
                if (typeof entity === 'string') {
                    return {'id': entity, 'delay': 0};
                } else {
                    return Object.assign({}, entity);
                }
            });
        }

        get _entities() {
            return this._config.entities || [];
        }

        get _title() {
            return this._config.title || '';
        }


        render() {
            return ct.LitHtml `
              <div class="card-config">
                <paper-input
                    label='Title'
                    .configAttribute=${'title'}
                    .configObject=${'_config'}
                    .value=${this._config.title}
                    @value-changed=${this._valueChanged}>
                </paper-input>

                ${this._createEntitiesElement()}
              </div>
            `;
        }

        _createEntitiesElement() {
            if (!this.hass || !this._config) {
                return ct.LitHtml ``;
            }
            return ct.LitHtml `
                  <div class="card-background" style="max-height: 400px; overflow: auto;">
                    ${this._createEntitiesValues()}
                    <div class="sub-category" style="display: flex; flex-direction: column; align-items: flex-end;">
                      <ha-fab
                        mini
                        icon="mdi:plus"
                        @click=${this._addEntity}
                        .configArray=${this._config.entities}
                        .configAddValue=${'id'}
                        .sourceArray=${this._config.entities}
                      ></ha-fab>
                    </div>
                  </div>
            `;
        }

        _createEntitiesValues() {
            if (!this.hass || !this._config) {
                return [ct.LitHtml ``];
            }
            const entities = this._availableEntities();
            const valueElementArray = [];
            for (const entity of this._config.entities) {
                const index = this._config.entities.indexOf(entity);
                valueElementArray.push(ct.LitHtml `
                    <div class="sub-category" style="display: flex; flex-direction: row; align-items: center;">
                      <div class="value" style="flex-grow: 1;">
                        <paper-dropdown-menu
                          label="Entity"
                          @value-changed=${this._valueChanged}
                          .configAttribute=${'id'}
                          .configObject=${this._config.entities[index]}
                          .ignoreNull=${true}
                          style="width: 100%;"
                        >
                          <paper-listbox
                            slot="dropdown-content"
                            .selected=${entities.indexOf(entity.id)}
                            fallback-selection="0"
                          >
                            ${entities.map(entity => {
                            return ct.LitHtml `
                                <paper-item>${entity}</paper-item>
                              `;
                        })}
                          </paper-listbox>
                        </paper-dropdown-menu>
                      </div>
                      ${index !== 0
                            ? ct.LitHtml `
                            <ha-icon
                              class="ha-icon-large"
                              icon="mdi:arrow-up"
                              @click=${this._moveEntity}
                              .configDirection=${'up'}
                              .configArray=${this._config.entities}
                              .arrayAttribute=${'entities'}
                              .arraySource=${this._config}
                              .index=${index}
                            ></ha-icon>
                          `
                            : ct.LitHtml `
                            <ha-icon icon="mdi:arrow-up" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
                          `}
                      ${index !== this._config.entities.length - 1
                            ? ct.LitHtml `
                            <ha-icon
                              class="ha-icon-large"
                              icon="mdi:arrow-down"
                              @click=${this._moveEntity}
                              .configDirection=${'down'}
                              .configArray=${this._config.entities}
                              .arrayAttribute=${'entities'}
                              .arraySource=${this._config}
                              .index=${index}
                            ></ha-icon>
                          `
                            : ct.LitHtml `
                            <ha-icon icon="mdi:arrow-down" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
                          `}
                      <ha-icon
                        class="ha-icon-large"
                        icon="mdi:close"
                        @click=${this._removeEntity}
                        .configAttribute=${'entities'}
                        .configArray=${this._config}
                        .configIndex=${index}
                      ></ha-icon>
                    </div>
                    <div class="options">
                      ${this._createValueElement(index)}
                    </div>
                `);
            }
            return valueElementArray;
        }

        _availableEntities() {
            return Object.keys(this.hass.states).filter(
                (eid) => {
                    const state = this.hass.states[eid];
                    const attribution = state.attributes.attribution;
                    return !!attribution && attribution.toLowerCase().includes('västtrafik');
                }
            );
        }

        _createValueElement(index) {
            if (!this.hass) {
                return ct.LitHtml ``;
            }
            const entity = this._config.entities[index];
            console.log(entity);
            return ct.LitHtml `
              <div class="category" id="value">
                  <div class="value">
                    <paper-input
                      class="value-number"
                      label="Delay"
                      type="number"
                      .value="${entity.delay ? entity.delay : ''}"
                      editable
                      .configAttribute=${'delay'}
                      .configObject=${this._config.entities[index]}
                      @value-changed=${this._valueChanged}
                    ></paper-input>
                  </div>
              </div>
            `;
        }

        _createEditorElement() {
            return ct.LitHtml `
          <ha-code-editor
            mode="yaml"
            autofocus=""
            _value=${`test: who`}
            @value-changed=${this._valueChanged}
          ></ha-code-editor>
        `;
        }

        _addEntity(ev) {
            if (!this._config || !this.hass) {
                return;
            }
            const target = ev.target;
            let newObject;
            if (target.configAddObject) {
                newObject = target.configAddObject;
            }
            else {
                newObject = { [target.configAddValue]: '' };
            }
            const newArray = target.configArray.slice();
            newArray.push(newObject);
            this._config.entities = newArray;

            fireEvent(this, 'config-changed', { config: this._config });
        }
        _moveEntity(ev) {
            if (!this._config || !this.hass) {
                return;
            }
            const target = ev.target;
            let newArray = target.configArray.slice();
            if (target.configDirection == 'up')
                newArray = arrayMove(newArray, target.index, target.index - 1);
            else if (target.configDirection == 'down')
                newArray = arrayMove(newArray, target.index, target.index + 1);
            this._config.entities = newArray;
            fireEvent(this, 'config-changed', { config: this._config });
        }
        _removeEntity(ev) {
            if (!this._config || !this.hass) {
                return;
            }
            const target = ev.target;
            const entitiesArray = [];
            let index = 0;
            for (const config of this._config.entities) {
                if (target.configIndex !== index) {
                    entitiesArray.push(config);
                }
                index++;
            }
            const newConfig = { [target.configArray]: entitiesArray };
            this._config = Object.assign(this._config, newConfig);
            fireEvent(this, 'config-changed', { config: this._config });
        }

        _valueChanged(ev) {
            if (!this._config || !this.hass) {
                return;
            }
            const target = ev.target;
            if (target.configObject[target.configAttribute] == target.value) {
                return;
            }
            
            if (target.configAttribute && target.configObject) {
                if (target.value == '' || target.value === false) {
                    if (target.ignoreNull == true)
                        return;
                    delete target.configObject[target.configAttribute];
                }
                else {
                    console.log(target.configObject);
                    target.configObject[target.configAttribute] = target.value;
                }
            }

            fireEvent(this, 'config-changed', { config: this._config });
        }

        static get styles() {
            return ct.LitCSS`
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

                .option {
                    padding: 4px 0px;
                    cursor: pointer;
                }
                .options {
                    background: var(--primary-background-color);
                    border-radius: var(--ha-card-border-radius);
                    cursor: pointer;
                    padding: 8px;
                }
                .sub-category {
                    cursor: pointer;
                }
                .row {
                    display: flex;
                    margin-bottom: -14px;
                    pointer-events: none;
                    margin-top: 14px;
                }
                .title {
                    padding-left: 16px;
                    margin-top: -6px;
                    pointer-events: none;
                }
                .secondary {
                    padding-left: 40px;
                    color: var(--secondary-text-color);
                    pointer-events: none;
                }
                .value {
                    padding: 0px 8px;
                }
                .value-container {
                    padding: 0px 8px;
                    transition: all 0.5s ease-in-out;
                }
                .value-container:target {
                    height: 50px;
                }
                .value-number {
                    width: 100px;
                }
                ha-fab {
                    margin: 8px;
                }
                ha-switch {
                    padding: 16px 0;
                }
                .card-background {
                    background: var(--paper-card-background-color);
                    border-radius: var(--ha-card-border-radius);
                    padding: 8px;
                }
                .category {
                    background: #0000;
                }
                .ha-icon-large {
                    cursor: pointer;
                    margin: 0px 4px;
                }
            `;
        }
    }

    customElements.define('vasttrafik-card-editor', VasttrafikCardEditor);
});

setTimeout(() => {
    if (!customElements.get('card-tools')) {
        customElements.define('vasttrafik-card-editor', class extends ct.LitHtmlElement {
            setConfig() {
                throw new Error('Cant find card-tools. See https://github.com/thomasloven/lovelace-card-tools');
            }
        });
    }
}, 2000);
