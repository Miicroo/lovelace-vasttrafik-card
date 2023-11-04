customElements.whenDefined('card-tools').then(() => {
    const ct = customElements.get('card-tools');

    class VasttrafikCard extends ct.LitElement {

        static async getConfigElement() {
            await import("./vasttrafik-card-editor.js");
            return document.createElement("vasttrafik-card-editor");
        }
    
        static get properties() {
            return {
                config: {},
                hass: {},
                translations: {},
            };
        }
        
        constructor() {
            super();

            this.translations = {
                'en': {
                    'departureTime': 'Time',
                    'departureStation': 'From',
                    'heading': 'Heading to',
                    'direction': 'Direction',
                    'leaveHome': 'Leave in',
                },
                'sv': {
                    'departureTime': 'Avgår kl.',
                    'departureStation': 'Från',
                    'heading': 'Till',
                    'direction': 'Mot',
                    'leaveHome': 'Gå om',
                },
                'nb': {
                    'departureTime': 'Avgang kl.',
                    'departureStation': 'Går fra',
                    'heading': 'Til',
                    'direction': 'Mot',
                    'leaveHome': 'Gå om',
                },
                'nn': {
                    'departureTime': 'Avgang kl.',
                    'departureStation': 'Går fra',
                    'heading': 'Til',
                    'direction': 'Mot',
                    'leaveHome': 'Gå om',
                },
                'da': {
                    'departureTime': 'Afgang kl.',
                    'departureStation': 'Afgår fra',
                    'heading': 'Til',
                    'direction': 'Mod',
                    'leaveHome': 'Afsted om',
                },
                'nl': {
                    'departureTime': 'Vertrektijd',
                    'departureStation': 'Van',
                    'heading': 'Naar',
                    'direction': 'Richting',
                    'leaveHome': 'Vertrek over',
                },
            };
        }

        setConfig(config) {
            this.title = config.title || 'Västtrafik';
            this.shouldSort = config.sort !== undefined ? !!(config.sort) : true;
            this.showFrom = config.showFrom !== undefined ? !!(config.showFrom) : true;
            this.showTo = config.showTo !== undefined ? !!(config.showTo) : false;
            this.showDir = config.showDir !== undefined ? !!(config.showDir) : false;
            this.municipality = config.municipality || 'Göteborg';
            this.entities = this._parseEntities(config.entities);
            this.config = config;
        }

        _parseEntities(configuredEntities) {
            return configuredEntities.map(entity => {
                if (typeof entity === 'string') {
                    return {'id': entity};
                } else {
                    return Object.assign({}, entity);
                }
            });
        }

        render() {
            if (!this.isVerified) {
                this._verifyEntities();
                this.isVerified = true;
            }
        
            let hassEntities = this._getHassEntities();
            hassEntities = this._sortEntities(hassEntities);
            const renderedEntities = hassEntities.map(entity => this._renderEntity(entity));

            const linesCssFile = `lines-${this.municipality.toLowerCase().replace(' ', '-').replace('å', 'a').replace('ä', 'a').replace('ö', 'o')}.css`;

            return ct.LitHtml`
                <link type="text/css" rel="stylesheet" href="/local/community/lovelace-vasttrafik-card/vasttrafik-card.css"></link>
                <link type="text/css" rel="stylesheet" href="/local/community/lovelace-vasttrafik-card/${linesCssFile}"></link>
                <ha-card>
                    <div class="card-header">
                        ${this.title}
                    </div>
                    <div>
                        <table>
                            <tr>
                                <th align="left"></th>
                                <th align="left">${this._getTranslatedText('departureTime')}</th>
                                ${this.showFrom ? ct.LitHtml`<th align="left">${this._getTranslatedText('departureStation')}</th>` : ''}
                                ${this.showTo ? ct.LitHtml`<th align="left">${this._getTranslatedText('heading')}</th>` : ''}
                                ${this.showDir ? ct.LitHtml`<th align="left">${this._getTranslatedText('direction')}</th>` : ''}
                                <th align="left">${this._getTranslatedText('leaveHome')}</th>
                            </tr>
                            ${renderedEntities}
                        </table>
                    </div>
                </ha-card>`;
        }
    
        _verifyEntities() {
            this._getHassEntities()
                .forEach(entity => {
                    const attribution = entity.attributes.attribution;
                    if (!attribution || !attribution.toLowerCase().includes('västtrafik')) {
                        console.warn(`WARNING: ${entity.entity_id} does not seem to be a Västtrafik-sensor. Instead it is attributed to ${attribution}`);
                    }
                });
        }

        // Get the hass representations of this.entities
        _getHassEntities() {
            return this.entities
                .filter(entity => this.hass.states.hasOwnProperty(entity.id))
                .map(entity => this.hass.states[entity.id]);
        }

        _sortEntities(hassEntities) {                
            if (this.shouldSort) {
                hassEntities.sort((a, b) => this._getTimeUntil(a) - this._getTimeUntil(b));
            }

            return hassEntities;
        }

        _renderEntity(hassEntity) {
            const attributes = hassEntity.attributes;

            const line = attributes.line;
            const lineClass = this._getLineClass(line);
            const departureTime = hassEntity.state;
            const timeUntilLeave = this._getTimeUntil(hassEntity);
            const from = attributes.from || '';
            const heading = attributes.to || '';
            const direction = attributes.direction || '';

            return ct.LitHtml`<tr>
                            <td class="${lineClass} line">${line}</td>
                            <td>${departureTime}</td>
                            ${this.showFrom ? ct.LitHtml`<td>${from}</td>` : ''}
                            ${this.showTo ? ct.LitHtml`<td>${heading}</td>` : ''}
                            ${this.showDir ? ct.LitHtml`<td>${direction}</td>` : ''}
                            <td>${timeUntilLeave} minutes</td>
                        </tr>`;
        }

        _getLineClass(line) {
            return `line-${line}`;
        }

        _getTimeUntil(hassEntity) {
            const now = new Date();
            const nowHour = now.getHours();
            const nowMinute = now.getMinutes();
            const expectedTime = hassEntity.state.split(':');
            const expectedHour = parseInt(expectedTime[0]);
            const expectedMinute = parseInt(expectedTime[1]);
            let hourDiff = expectedHour < nowHour ? 24 + (expectedHour - nowHour) : expectedHour - nowHour;
            let minuteDiff = expectedMinute - nowMinute;
            if (minuteDiff < 0) {
                minuteDiff += 60;
                hourDiff--;
            }
            const delay = hassEntity.attributes.delay || 0;
            return hourDiff * 60 + minuteDiff - delay;
        }
        
        _getTranslatedText(textKey) {
            let language = this.hass?.language || 'en';
            if (!this.translations.hasOwnProperty(language)) {
                console.debug(`Language "${language}" is not configured, using english instead`);
                language = 'en';
            }
            return this.translations[language][textKey] || 'Unknown';
        }
    }

    customElements.define('vasttrafik-card', VasttrafikCard);
});

setTimeout(() => {
    if (!customElements.get('card-tools')) {
        customElements.define('vasttrafik-card', class extends HTMLElement {
            setConfig() {
                throw new Error("Can't find card-tools. See https://github.com/thomasloven/lovelace-card-tools");
            }
        });
    }
}, 2000);
