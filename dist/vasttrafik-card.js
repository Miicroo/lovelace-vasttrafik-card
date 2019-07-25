class VasttrafikCard extends Polymer.Element {

  static get template() {
    return Polymer.html`
      <link type="text/css" rel="stylesheet" href="/local/custom_ui/vasttrafik-card/vasttrafik-card.css"></link>
      <ha-card>
        <div class="header">
            [[_title]]
        </div>
        <table class="content">
        </table>
      </ha-card>
    `
  }

  setConfig(config) {
    if (!config.entities || config.entities.length === 0) {
      throw new Error("Specify at least one entity!");
    }
    this._config = config;
    this._title = config.title || 'Västtrafik';
  }

  set hass(hass) {
    this._hass = hass;
    this.update();
  }

  update() {
    if(!this.shadowRoot) {
      return;
    }

    const entitiesAsUi = this._config.entities
                                     .map(id => this.createRow(id))
                                     .reduce((all, current) => all + current, '');

    const contentElement = this.shadowRoot.querySelector(".content");
    contentElement.innerHTML = entitiesAsUi;
  }

  createRow(entityId) {
    if (!(entityId in this._hass.states)) {
       return;
    }

    const entity = this._hass.states[entityId];
    const attributes = entity.attributes;
    const line = attributes.line;
    const lineClass = this.getLineClass(line);
    const direction = attributes.direction;
    const track = attributes.track;
    const departureTime = entity.state;
    const accessibilityIcon = attributes.accessibility === 'wheelChair' ? 'mdi:wheelchair-accessibility' : '';
    const timeUntilDeparture = this.getTimeUntil(departureTime);

    return `<tr>
              <td class="${lineClass} line">${line}</td>
              <td>${direction}</td>
              <td>${timeUntilDeparture} minutes</td>
              <td>${departureTime}</td>
              <td>${track}</td>
              <td><ha-icon icon="${accessibilityIcon}"></ha-icon></td>
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

  getTimeUntil(hhmm) {
    const now = new Date();
    const nowHour = now.getHours();
    const nowMinute = now.getMinutes();
    const expectedTime = hhmm.split(':');
    const expectedHour = parseInt(expectedTime[0]);
    const expectedMinute = parseInt(expectedTime[1]);
    let hourDiff = expectedHour < nowHour ? 24+(expectedHour-nowHour) : expectedHour-nowHour;
    let minuteDiff = expectedMinute-nowMinute;
    if(minuteDiff < 0) {
      minuteDiff += 60;
      hourDiff--;
    }

    return hourDiff*60 + minuteDiff;
  }
}
customElements.define('vasttrafik-card', VasttrafikCard);
