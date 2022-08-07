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
            };
        }

        setConfig(config) {
            this.title = config.title || 'Västtrafik';
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

        render() {
	       if (!this.isVerified) {
                this._verifyEntities();
                this.isVerified = true;
            }
	    
            this._sortEntities();
            const renderedEntities = this.entities.map(entity => this._renderEntity(entity));

            return ct.LitHtml`
	            <link type="text/css" rel="stylesheet" href="/local/community/lovelace-vasttrafik-card/vasttrafik-card.css"></link>
	            <ha-card>
	                <div class="card-header">
	                    ${this.title}
	                </div>
	                <div>
	                    <table>
	                        <tr>
	                            <th align="left"></th>
	                            <th align="left">Time</th>
	                            <th align="left">From</th>
	                            <th align="left">Leave home</th>
	                        </tr>
	                        ${renderedEntities}
	                    </table>
	                </div>
	            </ha-card>`;
        }
	
        _verifyEntities() {
            this.entities
                .filter(entity => !!this.hass.states[entity.id])
                .forEach(entity => {
                    const attribution = this.hass.states[entity.id].attributes.attribution;

                    if (!attribution || !attribution.toLowerCase().includes('västtrafik')) {
                        console.warn(`WARNING: ${entity.id} does not seem to be a Västtrafik-sensor. Instead it is attributed to ${attribution}`);
                    }
                });
        }

        _sortEntities() {
            this.entities = this.entities
                .filter(entity => entity.id in this.hass.states)
                .map(entity => Object.assign({}, {'departureTime': this.hass.states[entity.id].state}, entity));

            this.entities.sort((a, b) => this._getTimeUntil(a) - this._getTimeUntil(b));
        }

        _renderEntity(entity) {
            if (!(entity.id in this.hass.states)) {
                return;
            }

            const hassEntity = this.hass.states[entity.id];
            const attributes = hassEntity.attributes;

            const line = attributes.line;
            const lineClass = this._getLineClass(line);
            const departureTime = hassEntity.state;
            const timeUntilLeave = this._getTimeUntil(entity);
            const from = attributes.from || '';

            if (this._getTimeUntil(entity) > 30) {
                this.hass.callService("system_log", "write",
                    {
                        "level": "warning",
                        "logger": "lovelace-vasttrafik-card",
                        "message": `${line} has old values, departures in ${timeUntilLeave} at ${departureTime}`,
                    }
                );
            }

            return ct.LitHtml`<tr>
                            <td class="${lineClass} line">${line}</td>
                            <td>${departureTime}</td>
                            <td>${from}</td>
                            <td>${timeUntilLeave} minutes</td>
                        </tr>`;
        }

        _getLineClass(line) {
            const tramLines = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '13'];
            const busRapidTransits = ['16', '17', '18', '19', '25', '50', '52', '60'];

            if (tramLines.indexOf(line) !== -1) {
                return `line-${line}`;
            } else if (busRapidTransits.indexOf(line) !== -1) {
                return 'bus-rapid-transit';
            } else {
                return 'regular-line';
            }
        }

        _getTimeUntil(entity) {
            const now = new Date();
            const nowHour = now.getHours();
            const nowMinute = now.getMinutes();
            const expectedTime = entity.departureTime.split(':');
            const expectedHour = parseInt(expectedTime[0]);
            const expectedMinute = parseInt(expectedTime[1]);
            let hourDiff = expectedHour < nowHour ? 24 + (expectedHour - nowHour) : expectedHour - nowHour;
            let minuteDiff = expectedMinute - nowMinute;
            if (minuteDiff < 0) {
                minuteDiff += 60;
                hourDiff--;
            }

            return hourDiff * 60 + minuteDiff - entity.delay;
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
