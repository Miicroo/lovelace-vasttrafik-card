vasttrafik-card
========================

Styled entities using the Västtrafik theme in a lovelace entities card. All trams and buses are styled using the colours used in Göteborg, so if you are living in Västra Götaland but outside of Göteborg you have to change the css manually.

## Options

| Name | Type | Default | Description
| ---- | ---- | ------- | -----------
| entities | list | **Required** | Entity ids of the Västtrafik sensors
| title | string | Västtrafik | The title of the card
| groupBy | string | null | Groups sensors based on `departure` or `destination`

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

## Grouping
It is possible to group the sensors based on departure or destination stop. Use the config `groupBy` with either `from` or `to` as value. Incorrect values will be interpreted as `to`.

For this to work, the sensors must expose the configured `from` and `to` as attributes which [this custom vasttrafik sensor does](https://github.com/Miicroo/ha-vasttrafik). If you use the built-in sensor from HomeAssistant, all sensors will be grouped in the same group named 'Västtrafik'.

```yaml
type: 'custom:vasttrafik-card'
# title has no effect here
entities:
  - sensor.fran_valand_to_hjalmar
  - sensor.fran_valand_to_vasa
  - sensor.fran_hjalmar_to_valand
groupBy: from
```
![Example of grouped sensors](https://raw.githubusercontent.com/Miicroo/ha-lovelace-vasttrafik_card/master/resources/4.png)

## In case of errors
1. A warning will be printed to the console if any entity id you provide is not attributed to Västtrafik
2. The default sensor does not expose from/to, see Grouping section for full set up
3. The sensor updates every 2 minutes, so you will sometimes get `-1 minutes` until departure
