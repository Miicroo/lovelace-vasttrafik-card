const LitElement = Object.getPrototypeOf(customElements.get("hui-view"));
const html = LitElement.prototype.html;

class VasttrafikCard extends LitElement {
  static get properties() {
    return {
      _config: {
        entities: []
      },
      _hass: {
        states: []
      }
    };
  }

  setConfig(config) {
    if (!config.entities || config.entities.length === 0) {
      throw new Error("Specify at least one entity!");
    }

    for(let i = 0; i<config.entities.length; i++) {
      if (typeof config.entities[i] === 'string') {
        config.entities[i] = {'id': config.entities[i], 'delay': 0};
      }
    }

    this._config = config;
  }

  set hass(hass) {
    this._hass = hass;

    if (!this._isVerified) {
      this.verifyEntities();
      this._isVerified = true;
    }

    this.createCardTemplates();
  }

  verifyEntities() {
    this._config.entities
      .filter(entity => !!this._hass.states[entity.id])
      .forEach(entity => {
        const attribution = this._hass.states[entity.id].attributes.attribution;

        if (!attribution || !attribution.toLowerCase().includes('västtrafik')) {
          console.warn(`WARNING: ${entity.id} does not seem to be a Västtrafik-sensor. Instead it is attributed to ${attribution}`);
        }
      });
  }

  createCardTemplates() {
    this._config.entities
      .filter(entity => !!this._hass.states[entity.id])
      .forEach(entity => entity['departureTime'] = this._hass.states[entity.id].state);

    this._config.entities.sort((a,b) => this.getTimeUntil(a) - this.getTimeUntil(b));
  }

  render() {
    const title = this._config.title || 'Västtrafik';
    const renderedEntities = this._config.entities.map(entity => this.renderEntity(entity));

    return html`
      <link type="text/css" rel="stylesheet" href="/community_plugin/lovelace-vasttrafik-card/vasttrafik-card.css"></link>
      <ha-card>
        <div class="card-header">
          ${title}
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

  renderEntity(entity) {
    if (!(entity.id in this._hass.states)) {
       return;
    }

    const hassEntity = this._hass.states[entity.id];
    const attributes = hassEntity.attributes;

    const line = attributes.line;
    const lineClass = this.getLineClass(line);
    const departureTime = hassEntity.state;
    const timeUntilLeave = this.getTimeUntil(entity);
    const from = attributes.from || '';

    return html`<tr>
              <td class="${lineClass} line">${line}</td>
              <td>${departureTime}</td>
              <td>${from}</td>
              <td>${timeUntilLeave} minutes</td>
            </tr>`;
  }

  getLineClass(line) {
    const tramLines = ['1','2','3','4','5','6','7','8','9','10','11','13'];
    const busRapidTransits = ['16','17','18','19','25','50','52','60'];

    if(tramLines.indexOf(line) !== -1) {
      return `line-${line}`;
    } else if(busRapidTransits.indexOf(line) !== -1) {
      return 'bus-rapid-transit';
    } else {
      return 'regular-line';
    }
  }

  getTimeUntil(entity) {
    const now = new Date();
    const nowHour = now.getHours();
    const nowMinute = now.getMinutes();
    const expectedTime = entity.departureTime.split(':');
    const expectedHour = parseInt(expectedTime[0]);
    const expectedMinute = parseInt(expectedTime[1]);
    let hourDiff = expectedHour < nowHour ? 24+(expectedHour-nowHour) : expectedHour-nowHour;
    let minuteDiff = expectedMinute-nowMinute;
    if(minuteDiff < 0) {
      minuteDiff += 60;
      hourDiff--;
    }

    return hourDiff*60 + minuteDiff - entity.delay;
  }
}
customElements.define('vasttrafik-card', VasttrafikCard);