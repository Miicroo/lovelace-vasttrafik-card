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

    export class VasttrafikCardEditor extends ct.LitElement {

        static get properties() {
            return {
                hass: {},
                config: {}
            };
        }

        setConfig(config) {
            this.title = this.config.title;
            this.entities = this._parseEntities(config.entities);
            this.config = config;
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
            if (!this.hass) {
                return ct.LitHtml``;
            }

            const allowedEntities = Object.keys(this.hass.states).filter(
                (eid) => {
                    const state = this.hass.states[eid];
                    const attribution = state.attributes.attribution;
                    return !!attribution && attribution.toLowerCase().includes('västtrafik');
                }
            );

            return ct.LitHtml`
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

                return ct.LitHtml`
                                        <div class='entity'>
                                            <ha-entity-picker
                                                .hass='${this.hass}'
                                                .value='${entityId}'
                                                .configValue='${entityId}'
                                                .index='${index}'
                                                @change='${this._valueChanged}'>
                                                allow-custom-entity
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
            `;
        }
    }

    customElements.define('vasttrafik-card-editor', VasttrafikCardEditor);
});

setTimeout(() => {
    if (!customElements.get('card-tools')) {
        customElements.define('vasttrafik-card-editor', class extends HTMLElement {
            setConfig() {
                throw new Error('Cant find card-tools. See https://github.com/thomasloven/lovelace-card-tools');
            }
        });
    }
}, 2000);
