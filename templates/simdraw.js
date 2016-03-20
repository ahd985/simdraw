window.onresize = function() {
    var bbox = d3.select('.simdraw-visual').node().getBoundingClientRect();
    d3.select("#simdraw-svg").attr("viewbox", "(0 0 " + bbox.width + " " + bbox.height + ")")
};

function simdraw_context() {
    this.elements = {}

    this.active_element = null

    this.add_element = function(type, id) {
        if (type == 'rect') {
            this.elements[id] = new rect(type, id)
        } else if (type == 'circle') {
            this.elements[id] = new circle(type, id)
        } else if (type == 'path') {
            this.elements[id] = new path(type, id)
        }
    }

    this.get_element = function(id) {
        return this.elements[id]
    }

    this.activate_element = function(id) {
        this.active_element != null && this.elements[this.active_element].deactivate()
        this.elements[id].activate()
        this.active_element = id;
    }

    this.deactivate_element = function() {
        this.active_element != null && this.elements[this.active_element].deactivate()
        this.active_element = null;
    }

    this.initialize = function() {
        d3.select("#simdraw-container").on("click", context.deactivate_element())
    }
}

function element(type, id, pos, dims) {
    this.type = type;
    this.id = id;
    this.pos = pos;
    this.dims = dims;
    this.element_id = "element"
    this.style = {fill:"grey", stroke:"black", cursor:"move"};
    // Outline
    this.outline_id = "outline";
    this.outline_style = {fill:"none", stroke:"black", "stroke-width":"1px", "stroke-dasharray":"5,5"};
    this.outline_type = 'rect';
    this.outline_attr = {visibility:"hidden"}
    // Resizer
    this.resizer_id = "resizer";
    this.resizer_style = {fill:"red"};
    this.resizer_type = 'circle'
    this.resizer_attr = {r:2, cursor:"se-resize", visibility:"hidden"}

    this.set_element = function() {};
    this.set_resizer = function() {};
    this.set_outline = function() {};
    this.drag_move_func = function(d) {};
    this.drag_resize_func = function(d) {};

    this.initialize = function() {
        var g = d3.select("#simdraw-svg")
            .append("g")
            .datum(this.pos)
            .attr("transform", "translate(" + [ this.pos.x,this.pos.y ] + ") scale(1,1)")
            .attr("id", this.id)

        g.append(this.type)
            .attr("id", this.element_id)
            .style(this.style)
            .call(this.drag_move)
            .on("dblclick", function() {
                context.activate_element(this.parentNode.id)
            })

        g.append(this.outline_type)
            .attr("id", this.outline_id)
            .style(this.outline_style)
            .attr(this.outline_attr);

        g.append(this.resizer_type)
            .attr(this.resizer_attr)
            .attr("id", this.resizer_id)
            .style(this.resizer_style)
            .call(this.drag_resize);

        this.render(this.dims)
    }

    this.render = function(dims) {
        var g = d3.select("#" + this.id);
        datum = g.datum();
        for (var attr in dims) {datum[attr] = dims[attr]};
        g.datum(datum);

        var outline = g.select("#" + this.outline_id);
        var element = g.select("#" + this.element_id);
        var resizer = g.select("#" + this.resizer_id);

        this.set_outline(outline);
        this.set_element(element);
        this.set_resizer(resizer);
    }

    this.move = function(event) {
        var g = d3.select("#" + this.id);
        var datum = g.datum();
        datum.x += event.x;
        datum.y += event.y
        g.datum(datum)
            .attr("transform", function(d,i){
                return "translate(" + [ d.x,d.y ] + ")";
            });
    }

    this.activate = function() {
        var g = d3.select("#" + this.id);
        g.select("#" + this.outline_id).attr("visibility","visible")
        g.select("#" + this.resizer_id).attr("visibility","visible")
    }

    this.deactivate = function() {
        var g = d3.select("#" + this.id);
        g.select("#" + this.outline_id).attr("visibility","hidden")
        g.select("#" + this.resizer_id).attr("visibility","hidden")
    }
}

function rect(type, id) {
    var default_pos = {x:0, y:0};
    var default_dims = {width:50, height:50, margin:5};
    var rect = new element(type, id, default_pos, default_dims);

    rect.set_element = function(element) {
        element.attr("x", function(d) {return d.margin})
            .attr("y", function(d) {return d.margin})
            .attr("height", function(d) {return d.height})
            .attr("width", function(d) {return d.width})
    }

    rect.set_outline = function(outline) {
        outline.attr("height", function(d) {return d.height + 2*d.margin})
            .attr("width", function(d) {return d.width + 2*d.margin})
    }

    rect.set_resizer = function(resizer) {
        resizer.attr("cx", function(d) {return d.width + 2*d.margin})
            .attr("cy", function(d) {return d.height + 2*d.margin})
    }

    rect.drag_move = d3.behavior.drag()
        .origin(function(d) {return {x:0, y:0}})
        .on("drag", function(d) {
            context.get_element(this.parentNode.id).move(d3.event)
        });

    rect.drag_resize = d3.behavior.drag()
        .on("drag", function(d) {
            context.get_element(this.parentNode.id)
                .render({height:Math.max(1,d3.event.y - 2*d.margin), width:Math.max(1,d3.event.x - 2*d.margin)})
        });

    rect.initialize();

    return rect
}

function circle(type, id) {
    var default_pos = {x:0, y:0};
    var default_dims = {r:25, margin:5};
    var circle = new element(type, id, default_pos, default_dims);

    circle.set_element = function(element) {
        element.attr("r", function(d) {return d.r})
            .attr("cx", function(d) {return d.r + d.margin})
            .attr("cy", function(d) {return d.r + d.margin})
    }

    circle.set_resizer = function(resizer) {
        resizer.attr("cx", function(d) {return 2*(d.r + d.margin)})
            .attr("cy", function(d) {return 2*(d.r + d.margin)})
    }

    circle.set_outline = function(outline) {
        outline.attr("height", function(d) {return 2*d.r + 2*d.margin})
            .attr("width", function(d) {return 2*d.r + 2*d.margin})
    }

    circle.drag_move = d3.behavior.drag()
        .origin(function(d) {return {x:0, y:0}})
        .on("drag", function(d) {
            context.get_element(this.parentNode.id).move(d3.event)
        });

    circle.drag_resize = d3.behavior.drag()
        .on("drag", function(d) {
            var datum = d3.select("#" + this.parentNode.id).datum();
            context.get_element(this.parentNode.id)
                .render({r:Math.max(Math.min(d3.event.x/2,d3.event.y/2) - datum.margin,1), margin:datum.margin})
        });

    circle.initialize();

    return circle
}

function path(type, id) {
    var default_pos = {x:0, y:0};
    var default_dims = {path:[{x:0, y:0}, {x:50, y:50}], "max_x":50, "max_y":50, margin:5};
    var path = new element(type, id, default_pos, default_dims);

    path.line_function = d3.svg.line()
        .x(function(d) {return d.x})
        .y(function(d) {return d.y})
        .interpolate("linear");

    path.set_element = function(element) {
        element.attr("d", function(d) {return path.line_function(d.path)})
    }

    path.set_outline = function(outline) {
        outline.attr("height", function(d) {return d.max_y + 2*d.margin})
            .attr("width", function(d) {return d.max_x + 2*d.margin})
            .attr("x", function(d) {-d.margin})
            .attr("y", function(d) {-d.margin})
    }

    path.set_resizer = function(resizer) {
        resizer.attr("cx", function(d) {return d.max_x + 2*d.margin})
            .attr("cy", function(d) {return d.max_y + 2*d.margin})
    }

    path.drag_move = d3.behavior.drag()
        .origin(function(d) {return {x:0, y:0}})
        .on("drag", function(d) {
            context.get_element(this.parentNode.id).move(d3.event)
        });

    path.drag_resize = d3.behavior.drag()
        .on("drag", function(d) {
            var datum = d3.select("#" + this.parentNode.id).datum();
            context.get_element(this.parentNode.id)
                .render({"max_x":d3.max(), "max_y":d3.max(1,d3.event.y - 2*datum.margin),
                    margin:datum.margin})
        });

    path.initialize();

    return path
}

context = null;
$(document).ready(function() {
    context = new simdraw_context();
    context.initialize();
    context.add_element('rect', 'rect-1');
    context.add_element('circle', 'circle-1');
    context.add_element('path', 'path-1')
});