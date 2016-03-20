from jinja2 import Environment, PackageLoader

def render():
    env = Environment(loader=PackageLoader('simdraw', 'templates'))
    template = env.get_template('simdraw.html')

    html = template.render({'sim_visual': 'xxx'})

    with open('example/out.html', 'w') as f:
        f.write(html)