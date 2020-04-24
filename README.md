vasttrafik-card
========================

Styled entities using the Västtrafik theme in a lovelace entities card. All trams and buses are styled using the colours used in Göteborg, so if you are living in Västra Götaland but outside of Göteborg you have to change the css manually. This card also displays:
* When the next vehicle is leaving
* Departing station (which requires [this version](https://github.com/Miicroo/ha-vasttrafik) of the Västtrafik sensor)
* When you have to leave home in order to catch the vehicle (or the amount of minutes until the vehicle leaves if no delay is set).

> ![v1.0.0](resources/info.svg)
> 
> If you are looking for the Västtrafik-card where you can *group* sensors based on departure or destination, you want the (discontinued) [v1.0.0](https://github.com/Miicroo/lovelace-vasttrafik-card/releases/tag/v1.0.0)

## Options
| Name     | Type   | Default      | Description
| ----     | ----   | -------      | -----------
| entities | list   | **Required** | See [entity format](https://github.com/Miicroo/lovelace-vasttrafik-card#entity-format)
| title    | string | Västtrafik   | The title of the card

## Entity format
Entities can be defined in 3 different ways:

1) As a simple string containing the id
```yaml
- sensor.ekedal_till_brunnsparken
- sensor.godhemsgatan_till_brunnsparken
```
2) As an object containing the id and the delay in minutes (e.g. how long it would take you to walk to the departing station)
```yaml
- id: sensor.ekedal_till_brunnsparken
  delay: 3
- sensor.godhemsgatan_till_brunnsparken
  delay: 2
```
3) As a combination of 1) and 2), the entities without specified delay will get delay = 0.


## Examples
```yaml
type: 'custom:vasttrafik-card'
title: 'Mot Brunnsparken'
entities:
  - id: sensor.ekedal_till_brunnsparken
    delay: 3
  - sensor.godhemsgatan_till_brunnsparken
```

![Example 1](https://raw.githubusercontent.com/Miicroo/lovelace-vasttrafik-card/master/resources/1.png)

## Tram and bus styles
![Colours for each tram or bus line](https://raw.githubusercontent.com/Miicroo/ha-lovelace-vasttrafik_card/master/resources/colours.png)

## In case of errors
1. A warning will be printed to the console if any entity id you provide is not attributed to Västtrafik
2. The default sensor does not expose from/to, use [this one](https://github.com/Miicroo/ha-vasttrafik) instead
3. The sensor updates every 2 minutes, so you will sometimes get `-2 minutes` until departure
