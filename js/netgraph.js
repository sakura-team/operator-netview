
NODE_RADIUS = 15;
ARROW_MARGIN = 7;
LABEL_OFFSET_Y = 6;
ARROW_MIN_LENGTH = 10;
DEFAULT_STROKE_WIDTH = 3;
ZOOM_FACTOR = 1.1;

function Node(x, y, label) {
    this.circles = [];
    this.texts = [];
    this.linkedArrows = [];
    this.label = label;
    this.coordinates = {
        user: {x:x, y:y},
        display: {x:x, y:y},
        scaling: get_scaling_factors({center: { x:0, y:0 }, factor: 1})
    };
    let saved_this = this;
    for (let svg of document.querySelectorAll(".svggraph")) {
        let circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        circle.setAttributeNS(null, 'r', NODE_RADIUS);
        circle.setAttributeNS(null, 'class', 'node');
        circle.addEventListener('mousedown', function(evt) { svgStartDrag(evt, saved_this); });
        this.circles.push(circle);
        let text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        text.setAttributeNS(null, 'class', 'node-label');
        text.textContent = label;
        this.texts.push(text);
        svg.appendChild(circle);
        svg.appendChild(text);
    }
    this.setScaling = function(scaling) {
        this.coordinates.scaling = scaling;
        this.coordinates.display = scale(scaling, this.coordinates.user);
        this.redraw();
    };
    this.redraw = function() {
        for (let circle of this.circles) {
            circle.setAttributeNS(null, 'cx', this.coordinates.display.x);
            circle.setAttributeNS(null, 'cy', this.coordinates.display.y);
        }
        for (let text of this.texts) {
            text.setAttributeNS(null, 'x', this.coordinates.display.x);
            text.setAttributeNS(null, 'y', this.coordinates.display.y + LABEL_OFFSET_Y);
        }
        // redraw linked arrows
        this.linkedArrows.forEach(function(arrow) {
            arrow.redraw();
        });
    };
    this.onStartDrag = function(mousePos) {
        let offset = {
            x: mousePos.svg.x - this.coordinates.display.x,
            y: mousePos.svg.y - this.coordinates.display.y
        };
        return { offset: offset };
    };
    this.onDrag = function(info, mousePos) {
        // move center
        this.coordinates.display = {
            x: parseInt(mousePos.svg.x - info.offset.x, 10),
            y: parseInt(mousePos.svg.y - info.offset.y, 10),
        };
        // redraw
        this.redraw();
    };
    this.onEndDrag = function(info) {
        // refresh user coordinates from display coordinates
        this.coordinates.user = unscale(this.coordinates.scaling, this.coordinates.display);
    };
    this.getCenter = function() {
        return this.coordinates.display;
    };
    this.redraw();
    return this;
}

function NetGraph(svggraph) {
    this.svggraph = svggraph;
    this.viewbox = null;
    this.getViewBox = function() {
        return this.viewbox;
    };
    this.setViewBox = function(x, y, width, height) {
        x = round2Decimals(x);
        y = round2Decimals(y);
        width = round2Decimals(width);
        height = round2Decimals(height);
        this.viewbox = { x: x, y: y, width: width, height: height };
        this.svggraph.setAttributeNS(null, "viewBox",
                    x + " " + y + " " + width + " " + height);
    };
    this.getContainerSize = function() {
        let div = this.svggraph.parentNode;
        return {
            w: div.scrollWidth,
            h: div.scrollHeight
        };
    };
    this.setSize = function(width, height) {
        this.svggraph.setAttributeNS(null, "width", Math.floor(width));
        this.svggraph.setAttributeNS(null, "height", Math.floor(height));
    }
    this.onStartDrag = function(mousePos) {
        this.svggraph.classList.add("dragging");
        return { mouseStart:    mousePos.svg,
                 ctm:           this.svggraph.getScreenCTM(),
                 viewbox:       this.viewbox };
    };
    this.onDrag = function(info, mousePos) {
        // compute mouse offset
        let mouseEnd = pixelsToSvg( info.ctm,
                                    mousePos.pixels.x,
                                    mousePos.pixels.y);
        let offset = {  x: mouseEnd.x - info.mouseStart.x,
                        y: mouseEnd.y - info.mouseStart.y };
        // translate viewbox
        this.setViewBox(info.viewbox.x - offset.x,
                        info.viewbox.y - offset.y,
                        info.viewbox.width,
                        info.viewbox.height);
        // update zoom
        app.updateZoomView();
    };
    this.onEndDrag = function(info) {
        this.svggraph.classList.remove("dragging");
    };
    this.resize = function(area, fill) {
        let viewbox = {}, svg = {};
        // compute viewbox and svg size
        if (fill) {
            // check whether we are more limited on width or on height
            if (area.limitation == 'width') {
                // compute size based on width
                viewbox.x = area.min.x - area.margin;
                viewbox.w = area.w + 2*area.margin;
                viewbox.h = (viewbox.w * area.limits.h) / area.limits.w;
                viewbox.y = area.min.y - ((viewbox.h - area.h) / 2);
            }
            else {
                // compute size based on height
                viewbox.y = area.min.y - area.margin;
                viewbox.h = area.h + 2*area.margin;
                viewbox.w = (viewbox.h * area.limits.w) / area.limits.h;
                viewbox.x = area.min.x - ((viewbox.w - area.w) / 2);
            }
        }
        else {
            // do not fill available room, preserve aspect ratio
            viewbox.x = area.min.x - area.margin;
            viewbox.y = area.min.y - area.margin;
            viewbox.w = area.w + 2*area.margin;
            viewbox.h = area.h + 2*area.margin;
            if (area.limitation == 'width') {
                svg.w = area.limits.w;
                svg.h = (viewbox.h*svg.w) / viewbox.w;
            }
            else {
                svg.h = area.limits.h;
                svg.w = (viewbox.w*svg.h) / viewbox.h;
            }
            // set svg size
            this.setSize(svg.w, svg.h);
        }
        // update svg viewbox
        this.setViewBox(viewbox.x, viewbox.y, viewbox.w, viewbox.h);
    };
    this.updateZoomRect = function() {
        zoomRect.setShape(this.viewbox);
    };
    this.zoom = function(evt) {
        // center zooming on mouse position
        let mouse = getMousePosition(evt, this.svggraph).svg;
        if (evt.deltaY > 0) {
            factor = 1 / ZOOM_FACTOR;
        }
        else {
            factor = ZOOM_FACTOR;
        }
        return app.zoom({ center: mouse, factor: factor });
    };
    let saved_this = this;
    this.svggraph.addEventListener('mousedown', function(evt) { svgStartDrag(evt, saved_this); });
    this.svggraph.addEventListener('wheel', function(evt) { saved_this.zoom(evt); });
}

function initNetGraph() {
    svggraph = document.querySelector("#svggraph");
    netGraph = new NetGraph(svggraph);
    return netGraph;
}

function Arrow(node1, node2) {
    this.node1 = node1;
    this.node2 = node2;
    this.paths = [];
    for (let svg of document.querySelectorAll(".svggraph")) {
        let path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttributeNS(null, 'class', 'arrow');
        this.paths.push(path);
        svg.appendChild(path);
    }
    node1.linkedArrows.push(this);
    node2.linkedArrows.push(this);
    this.redraw = function() {
        let c1 = this.node1.getCenter();
        let c2 = this.node2.getCenter();

        let centerx = (c1.x + c2.x)/2;
        let centery = (c1.y + c2.y)/2;

        let dx = c2.x-c1.x;
        let dy = c2.y-c1.y;

        let distance = round2Decimals(Math.max(Math.sqrt((dx*dx)+(dy*dy)), 1));
        let arrowLength = Math.max(distance - 2*(NODE_RADIUS+ARROW_MARGIN), ARROW_MIN_LENGTH);

        let scale = round2Decimals(arrowLength / distance);

        let strokeWidth = round2Decimals(DEFAULT_STROKE_WIDTH / scale);
        let transform = "translate(" + centerx + " " + centery + ")";
        transform += " scale(" + scale + " " + scale + ")";
        let d = "M" + (c1.x-centerx) + " " + (c1.y-centery);
        d += " l" + dx + " " + dy;

        for (let path of this.paths) {
            path.setAttributeNS(null, 'stroke-width', strokeWidth);
            path.setAttributeNS(null, 'd', d);
            path.setAttributeNS(null, 'transform', transform);
        }
    };
    this.redraw();
    return this;
}

function initZoomRect(zoomSvgGraph) {
    zoomRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    zoomRect.id = 'zoom-rect';
    zoomRect.setAttributeNS(null, 'class', 'zoom-rect');
    zoomRect.getShape = function() {
        return {
            x: parseFloat(zoomRect.getAttributeNS(null, "x")),
            y: parseFloat(zoomRect.getAttributeNS(null, "y")),
            width: parseFloat(zoomRect.getAttributeNS(null, "width")),
            height: parseFloat(zoomRect.getAttributeNS(null, "height"))
        };
    };
    zoomRect.setShape = function(shape) {
        zoomRect.setAttributeNS(null, "x", shape.x);
        zoomRect.setAttributeNS(null, "y", shape.y);
        zoomRect.setAttributeNS(null, "width", shape.width);
        zoomRect.setAttributeNS(null, "height", shape.height);
    };
    zoomSvgGraph.appendChild(zoomRect);
}

function initZoomNetGraph() {
    /* copy main svg content to small one of zoom controls */
    let svgContent = document.querySelector("#svgdiv").innerHTML;
    let zoomSvgdiv = document.querySelector("#zoom-svgdiv");
    zoomSvgdiv.innerHTML = svgContent;
    /* retrieve svg element */
    let zoomSvgGraph = zoomSvgdiv.getElementsByTagNameNS("http://www.w3.org/2000/svg", "svg")[0];
    /* update element ID */
    zoomSvgGraph.id = 'zoom-svggraph';
    /* add zoom rect */
    initZoomRect(zoomSvgGraph);
    /* create and return NetGraph object */
    zoomNetGraph = new NetGraph(zoomSvgGraph);
    return zoomNetGraph;
}

