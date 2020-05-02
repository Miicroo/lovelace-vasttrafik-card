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

            this.title = this._config.title;
            this.entities = this._parseEntities(config.entities);

            const valueOptions = {
                icon: 'numeric',
                name: 'Settings',
                secondary: 'Value settings.',
                show: false,
            };
            const entityOptions = {
                show: false,
                options: {
                    value: Object.assign({}, valueOptions),
                },
            };

            this._entityOptionsArray = []; // TODO maybe move out, like to constructor?
            for (const config of this.entities) {
                this._entityOptionsArray.push(Object.assign({}, entityOptions));
            }

            if (!this._options) {
                this._options = {
                    entities: this._entityOptionsArray,
                };
            }
            console.log(this._options);
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
            return this.entities || [];
        }

        get _title() {
            return this.title || '';
        }


    render() {
        return ct.LitHtml `
          <div class="card-config">
            <paper-input
                label='Title'
                .value='${this._title}'
                .configValue='${'title'}'
                @value-changed='${this._valueChanged}'>
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
                    .configArray=${this.entities}
                    .configAddValue=${'entity'}
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
        const options = this._options.entities;
        const entities = this._availableEntities();
        const valueElementArray = [];
        for (const entity of this.entities) {
            const index = this.entities.indexOf(entity);
            valueElementArray.push(ct.LitHtml `
                <div class="sub-category" style="display: flex; flex-direction: row; align-items: center;">
                  <div style="display: flex; align-items: center; flex-direction: column;">
                    <div
                      style="font-size: 10px; margin-bottom: -8px; opacity: 0.5;"
                      @click=${this._toggleThing}
                      .options=${options[index]}
                      .optionsTarget=${options}
                      .index=${index}
                    >
                      options
                    </div>
                    <ha-icon
                      icon="mdi:chevron-${options[index].show ? 'up' : 'down'}"
                      @click=${this._toggleThing}
                      .options=${options[index]}
                      .optionsTarget=${options}
                      .index=${index}
                    ></ha-icon>
                  </div>
                  <div class="value" style="flex-grow: 1;">
                    <paper-dropdown-menu
                      label="Entity"
                      @value-changed=${this._valueChanged}
                      .configAttribute=${'id'}
                      .configObject=${this.entities[index]}
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
                          .configArray=${this.entities}
                          .arrayAttribute=${'entities'}
                          .arraySource=${this._config} // TODO ?!?
                          .index=${index}
                        ></ha-icon>
                      `
                        : ct.LitHtml `
                        <ha-icon icon="mdi:arrow-up" style="opacity: 25%;" class="ha-icon-large"></ha-icon>
                      `}
                  ${index !== this.entities.length - 1
                        ? ct.LitHtml `
                        <ha-icon
                          class="ha-icon-large"
                          icon="mdi:arrow-down"
                          @click=${this._moveEntity}
                          .configDirection=${'down'}
                          .configArray=${this.entities}
                          .arrayAttribute=${'entities'}
                          .arraySource=${this._config} // TODO !?!?
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
                    .configAttribute=${'entity'}
                    .configArray=${'entities'}
                    .configIndex=${index}
                  ></ha-icon>
                </div>
                ${options[index].show
                        ? ct.LitHtml `
                      <div class="options">
                        ${this._createValueElement(index)}
                      </div>
                    `
                : ''}
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
        const options = this._options.entities[index].options.value;
        const config = this.entities[index];
        return ct.LitHtml `
          <div class="category" id="value">
            ${options.show
                ? ct.LitHtml `
                  <div class="value">
                    <paper-input
                      class="value-number"
                      label="Delay"
                      type="number"
                      .value="${config.delay ? config.delay : ''}"
                      editable
                      .configAttribute=${'delay'}
                      .configObject=${config}
                      @value-changed=${this._valueChanged}
                    ></paper-input>
                  </div>
                `
                : ''}
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

    _toggleThing(ev) {
        const options = ev.target.options;
        const show = !options.show;
        if (ev.target.optionsTarget) {
            if (Array.isArray(ev.target.optionsTarget)) {
                for (const options of ev.target.optionsTarget) {
                    options.show = false;
                }
            }
            else {
                for (const [key] of Object.entries(ev.target.optionsTarget)) {
                    ev.target.optionsTarget[key].show = false;
                }
            }
        }
        options.show = show;
        this._toggle = !this._toggle;
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
        for (const config of this.entities) {
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
        if (target.configAdd && target.value !== '') {
            target.configObject = Object.assign(target.configObject, {
                [target.configAdd]: { [target.configAttribute]: target.value },
            });
        }
        if (target.configAttribute && target.configObject && !target.configAdd) {
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
        this._config.entities = this.entities;
        fireEvent(this, 'config-changed', { config: this._config });
    }

/*
        render() {
            if (!this.hass) {
                return ct.Litct.LitHtml``;
            }

            const allowedEntities = Object.keys(this.hass.states).filter(
                (eid) => {
                    const state = this.hass.states[eid];
                    const attribution = state.attributes.attribution;
                    return !!attribution && attribution.toLowerCase().includes('västtrafik');
                }
            );

            return ct.Litct.LitHtml`
                    <div class='card-config'>
                        <div>
                            <paper-input
                                label='Title'
                                .value='${this._title}'
                                .configValue='${'title'}'
                                @value-changed='${this._valueChanged}'>
                            </paper-input>
                            <div class='entities'>
                                ${this._entities.map((entityConf, index) => {
                const entityId = entityConf.id || entityConf;
                const entityDelay = entityConf.delay || 0;

                console.log(entityConf);
                console.log(entityId);
                console.log(entityDelay);

                return ct.Litct.LitHtml`
                                        <div class='entity'>
                                            <ha-entity-picker
                                                .hass='${this.hass}'
                                                .value='${entityId}'
                                                .configValue='${entityId}'
                                                .index='${index}'
                                                @change='${this._valueChanged}'>
                                            </ha-entity-picker>
                                            <paper-input
                                                id='year'
                                                type='number'
                                                no-label-float=''
                                                maxlength='4'
                                                max='9999'
                                                min='0'
                                                auto-validate='true'
                                                value='${entityDelay}'
                                                style='width: 50px;'
                                                @click='${(ev) => ev.stopPropagation()}'
                                                @change='${this.valueChanged}'>
                                            </paper-input>
                                            <paper-icon-button
                                                title='Move entity down'
                                                icon='hass:arrow-down'
                                                .index='${index}'
                                                @click='${this._entityDown}'
                                                ?disabled='${index === this._entities.length - 1}'>
                                            </paper-icon-button>
                                            <paper-icon-button
                                                title='Move entity up'
                                                icon='hass:arrow-up'
                                                .index='${index}'
                                                @click='${this._entityUp}'
                                                ?disabled='${index === 0}'>
                                            </paper-icon-button>
                                        </div>
                                    `;
            })}

                                <ha-entity-picker
                                    .hass='${this.hass}'
                                    @change='${this._addEntity}'>
                                </ha-entity-picker>
                            </div>
                        </div>
                    </div>
                `;
        }


        _addEntity(ev) {
            const target = ev.target;
            if (target.value === '') {
                return;
            }

            const newConfigEntities = this.entities.concat({
                id: target.value,
                delay: 0
            });
            target.value = '';

            fireEvent(this, 'entities-changed', {entities: newConfigEntities});
        }

        _entityUp(ev) {
            const target = ev.target;
            const newEntities = this.entities.concat();

            [newEntities[target.index - 1], newEntities[target.index]] = [
                newEntities[target.index],
                newEntities[target.index - 1],
            ];

            fireEvent(this, 'entities-changed', {entities: newEntities});
        }

        _entityDown(ev) {
            const target = ev.target;
            const newEntities = this.entities.concat();

            [newEntities[target.index + 1], newEntities[target.index]] = [
                newEntities[target.index],
                newEntities[target.index + 1],
            ];

            fireEvent(this, 'entities-changed', {entities: newEntities});
        }

        _valueChanged(ev) {
            if (!this.config || !this.hass) {
                return;
            }

            const target = ev.target;
            if (this[`_${target.configValue}`] === target.value) {
                return;
            }

            if (target.configValue) {
                if (target.value === '') {
                    delete this.config[target.configValue];
                } else {
                    this.config = {
                        ...this.config,
                        [target.configValue]: target.checked !== undefined ? target.checked : target.value,
                    };
                }
            }

            fireEvent(this, 'config-changed', {config: this.config});
        }*/

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
