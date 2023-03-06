import requests
import sys

def group_by_municipality(lines):
    data_by_municipality = {}

    for line in lines:
        data = line['versions'][0]
        municipalities = data['municipalities'] if len(data['municipalities']) > 0 else [{'name': 'Västra Götaland'}]

        for municipality in municipalities:
            existing_lines = data_by_municipality.get(municipality['name']) or []
            existing_lines.append(data)
            data_by_municipality[municipality['name']] = existing_lines

    return data_by_municipality

def group_by_color(lines):
    lines_by_color = {}

    for line in lines:
        color = f'{line["backgroundColor"]}_{line["borderColor"]}_{line["foregroundColor"]}'

        existing_lines = lines_by_color.get(color) or []
        existing_lines.append(line)
        lines_by_color[color] = existing_lines

    return lines_by_color


def generate_html(municipality, lines_by_color):
    html = ('<head>\n'
        '   <style type="text/css">\n'
        '       .line {\n'
        '           min-width: 26px;\n'
        '           min-height: 26px;\n'
        '           display: inline-flex;\n'
        '           flex-wrap: wrap;\n'
        '           align-items: center;\n'
        '           justify-content: center;\n'
        '       }\n'
        '       div {\n'
        '           margin-bottom: 10px;\n'
        '       }\n'
        '   </style>\n'
        '   <link rel="stylesheet" href="lines-goteborg.css">\n'
        f'  <title>{municipality} - line colours</title>\n'
        '</head>\n'
        '<body>\n'
    )

    for lines in lines_by_color.values():
        html += '   <div>\n'
        for line in lines:
            html += f'       <span class="line line-{line["shortName"]}">{line["shortName"]}</span>&nbsp;\n'
        html += '   </div>\n'

    html += '</body>\n'

    return html

def hex_to_rgb_string(hex):
    hex = hex.lstrip('#')
    (r, g, b) = tuple(int(hex[i:i+2], 16) for i in (0, 2, 4))

    return f'rgb({r}, {g}, {b})'

def download_html(html):
    with open('colour_helper.html', 'w') as html_file:
        html_file.write(html)
    

municipality = sys.argv[1] if len(sys.argv) > 1 else 'Göteborg'
response = requests.get('https://www.vasttrafik.se/api/timetables/lines')
all_lines = response.json()


data_by_municipality = group_by_municipality(all_lines)
lines = data_by_municipality[municipality]
lines_by_color = group_by_color(lines)

html = generate_html(municipality, lines_by_color)
download_html(html)
