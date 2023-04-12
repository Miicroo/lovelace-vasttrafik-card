vasttrafik-card
========================

Styled entities using the Västtrafik theme in a lovelace entities card. All trams and buses are styled using the colours used in their respective municipality.

This card also displays:
* When the next vehicle is leaving
* Departing station (which requires [this version](https://github.com/Miicroo/ha-vasttrafik) of the Västtrafik sensor)
* When you have to leave home in order to catch the vehicle (also known as the sensor delay).
* Sorting of entities, showing the next entity to depart first

> ![v1.0.0](resources/info.svg)
> 
> If you are looking for the Västtrafik-card where you can *group* sensors based on departure or destination, you want the (discontinued) [v1.0.0](https://github.com/Miicroo/lovelace-vasttrafik-card/releases/tag/v1.0.0)

## Options
| Name         | Type    | Default      | Description
| ----         | ----    | -------      | -----------
| entities     | list    | **Required** | A list of entity sensors provided by the Västtrafik integration
| title        | string  | Västtrafik   | The title of the card
| municipality | string  | Göteborg     | The municipality of the station(s), [more info here](https://github.com/Miicroo/lovelace-vasttrafik-card#municipality)
| sort         | boolean | true         | Whether to sort the departures (earliest first), or keep the entities in the given order
| showFrom     | boolean | true         | Whether to show the departing station or not
| showTo       | boolean | false        | Whether to show the arriving station or not

## Municipality
As there are many lines with the same name or number in Västra Götaland, the styles are split by municipality. For accuracy, choose the municipality of your departing sensor(s).

Currently supported municipalities:
```
Ale
Alingsås
Åmål
Årjäng
Bengtsfors
Bollebygd
Borås
Dals-Ed
Essunga
Falkenberg
Falköping
Färgelanda
Göteborg
Götene
Grästorp
Gullspång
Habo
Hallsberg
Härryda
Herrljunga
Hjo
Jönköping
Karlsborg
Kristinehamn
Kumla
Kungälv
Kungsbacka
Laxå
Lerum
Lidköping
Lilla Edet
Lysekil
Mariestad
Mark
Mellerud
Mölndal
Mullsjö
Munkedal
Nässjö
Norge
Öckerö
Örebro
Orust
Partille
Säffle
Skara
Skövde
Sotenäs
Stenungsund
Strömstad
Svenljunga
Tanum
Tibro
Tidaholm
Tjörn
Töreboda
Tranemo
Trollhättan
Uddevalla
Ulricehamn
Vänersborg
Vara
Varberg
Vårgårda
Västra Götaland
```


## Examples
```yaml
type: 'custom:vasttrafik-card'
title: 'Mot Brunnsparken'
entities:
  - sensor.ekedal_till_brunnsparken
  - sensor.godhemsgatan_till_brunnsparken
municipality: Göteborg
sort: true
```

![Example 1](https://raw.githubusercontent.com/Miicroo/lovelace-vasttrafik-card/master/resources/1.png)

## Tram and bus styles (example shows Göteborg)
![Colours for each tram or bus line](https://raw.githubusercontent.com/Miicroo/lovelace-vasttrafik-card/master/resources/new_colours.png)

## In case of errors
1. A warning will be printed to the console if any entity id you provide is not attributed to Västtrafik
2. The default sensor does not expose from/to, use [this one](https://github.com/Miicroo/ha-vasttrafik) instead
3. The sensor updates every 2 minutes, so you will sometimes get `-2 minutes` until departure


## Västtrafik updated their designs?
To get the latest designs/colours exported as css, run `python3 ../helpers/generate_css.py` from the `dist` folder.
