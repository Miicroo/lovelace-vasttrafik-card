vasttrafik-card
========================

Styled entities using the Västtrafik theme in a lovelace entities card. All trams and buses are styled using the colours used in Göteborg, so if you are living in Västra Götaland but outside of Göteborg you have to change the css manually.

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entities | list | **Required** | Entity ids of the Västtrafik sensors
| title | string | Västtrafik | The title of the card

## Examples
```yaml
type: 'custom:vasttrafik-card'
title: 'Valand <-> Hjalmar Brantingsplatsen'
entities:
  - sensor.fran_valand
  - sensor.fran_hjalmar
```

![Example 1](https://raw.githubusercontent.com/Miicroo/ha-lovelace-vasttrafik_card/master/resources/1.png)
![Example 2](https://raw.githubusercontent.com/Miicroo/ha-lovelace-vasttrafik_card/master/resources/2.png)
![Example 3](https://raw.githubusercontent.com/Miicroo/ha-lovelace-vasttrafik_card/master/resources/3.png)

## Tram and bus styles
![Colours for each tram or bus line](https://raw.githubusercontent.com/Miicroo/ha-lovelace-vasttrafik_card/master/resources/colours.png)

## In case of errors
1. A warning will be printed to the console if any entity id you provide is not attributed to Västtrafik
2. The sensor does not expose from/to, so it is not possible to show that in the card
3. The sensor updates every 2 minutes, so you will sometimes get `-1 minutes` until departure
