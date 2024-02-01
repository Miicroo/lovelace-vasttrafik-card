import requests

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


def generate_css(lines_by_color):
    css_styles = []
    for lines in lines_by_color.values():
        background_color = hex_to_rgb_string(lines[0]['backgroundColor'])
        border_color = hex_to_rgb_string(lines[0]['borderColor'])
        color = hex_to_rgb_string(lines[0]['foregroundColor'])

        line_names = sorted(set(map(lambda line: f'.line-{line["shortName"]}', lines)))
        css_class = ', '.join(line_names)

        css = f'{css_class} {{\n\tborder-color: {border_color};\n\tcolor: {color};\n\tbackground-color: {background_color};\n}}'
        css_styles.append(css)
    css_styles.sort()

    return '\n'.join(css_styles)

def hex_to_rgb_string(hex):
    hex = hex.lstrip('#')
    (r, g, b) = tuple(int(hex[i:i+2], 16) for i in (0, 2, 4))

    return f'rgb({r}, {g}, {b})'

def download_css(css, municipality):
    filename = f'lines-{municipality.lower().replace(" ", "-").replace("å","a").replace("ä","a").replace("ö","o")}.css'
    with open(filename, 'w') as css_file:
        css_file.write(css)
    print(f'{filename} generated')


response = requests.get('https://www.vasttrafik.se/api/timetables/lines')
all_lines = response.json()


data_by_municipality = group_by_municipality(all_lines)
for municipality in data_by_municipality:
    lines = data_by_municipality[municipality]
    lines_by_color = group_by_color(lines)

    css = generate_css(lines_by_color)
    download_css(css, municipality)
