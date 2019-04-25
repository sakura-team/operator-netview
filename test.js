
NODE_RADIUS = 15;
ARROW_MARGIN = 7;
LABEL_OFFSET_Y = 6;
ARROW_MIN_LENGTH = 10;
DEFAULT_STROKE_WIDTH = 3;
ZOOM_FACTOR = 1.1;
AUTOSIZE_MARGIN_PERCENT = 10;
EXPECTED_VIEWBOX_PIXEL_SIZE = 1.5;   // size in screen pixels of a viewbox unit

dragInfo = {
    elem: null
};

function round2Decimals(f) {
    return Math.round(f * 100) / 100;
}

function getMinMax(points) {
    let p, bounds = null;
    for (p of points) {
        if (bounds == null) {
            bounds = { min: {x:p.x, y:p.y}, max: {x:p.x, y:p.y} };
        }
        else {
            bounds.min.x = Math.min(bounds.min.x, p.x);
            bounds.max.x = Math.max(bounds.max.x, p.x);
            bounds.min.y = Math.min(bounds.min.y, p.y);
            bounds.max.y = Math.max(bounds.max.y, p.y);
        }
    }
    return bounds;
}

function scale(scaling, userCoordinates) {
    return {
        x: parseInt(scaling.center.x + scaling.factor * (userCoordinates.x - scaling.center.x), 10),
        y: parseInt(scaling.center.y + scaling.factor * (userCoordinates.y - scaling.center.y), 10)
    };
}

function unscale(scaling, displayCoordinates) {
    return {
        x: round2Decimals((displayCoordinates.x - scaling.center.x) / scaling.factor + scaling.center.x),
        y: round2Decimals((displayCoordinates.y - scaling.center.y) / scaling.factor + scaling.center.y)
    };
}

function svgStartDrag(evt, elem) {
    evt.preventDefault();
    if (dragInfo.elem != null) {
        // dragging already handled by an element with higher z-index
        return;
    }
    let svg = evt.target;
    while (svg.tagName != 'svg') {
        svg = svg.parentNode;
    }
    let mousePos = getMousePosition(evt, svg);
    dragInfo = elem.onStartDrag(mousePos);
    dragInfo.elem = elem;
    dragInfo.svg = svg;
    window.addEventListener('mousemove', svgDrag);
    window.addEventListener('mouseup', svgEndDrag);
    window.addEventListener('mouseleave', svgEndDrag);
}

function svgDrag(evt) {
    evt.preventDefault();
    // call element's custom callback
    let mousePos = getMousePosition(evt, dragInfo.svg);
    dragInfo.elem.onDrag(dragInfo, mousePos);
}

function svgEndDrag() {
    dragInfo.elem.onEndDrag(dragInfo);
    dragInfo.elem = null;
    window.removeEventListener('mousemove', svgDrag);
    window.removeEventListener('mouseup', svgEndDrag);
    window.removeEventListener('mouseleave', svgEndDrag);
}

function pixelsToSvg(ctm, x, y) {
    return {
        x: (x - ctm.e) / ctm.a,
        y: (y - ctm.f) / ctm.d
    }
}

function getMousePosition(evt, svg) {
    return {
        pixels: {
            x: evt.clientX,
            y: evt.clientY
        },
        svg: pixelsToSvg(svg.getScreenCTM(), evt.clientX, evt.clientY)
    };
}

function Node(x, y, label) {
    this.circles = [];
    this.texts = [];
    this.linkedArrows = [];
    this.label = label;
    this.coordinates = {
        user: {x:x, y:y},
        display: {x:x, y:y},
        scaling: {center: { x:0, y:0 }, factor: 1}
    };
    let saved_this = this;
    for (svg of document.querySelectorAll(".svggraph")) {
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
        for (circle of this.circles) {
            circle.setAttributeNS(null, 'cx', this.coordinates.display.x);
            circle.setAttributeNS(null, 'cy', this.coordinates.display.y);
        }
        for (text of this.texts) {
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
            x: round2Decimals(mousePos.svg.x - info.offset.x),
            y: round2Decimals(mousePos.svg.y - info.offset.y),
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
        this.svggraph.setAttributeNS(null, "width", width);
        this.svggraph.setAttributeNS(null, "height", height);
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
        this.setViewBox(round2Decimals(info.viewbox.x - offset.x),
                        round2Decimals(info.viewbox.y - offset.y),
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
            svg.w = area.limits.w;
            svg.h = area.limits.h;
            // check whether we are more limited on width or on height
            if (area.limitation == 'width') {
                // compute size based on width
                viewbox.x = area.min.x - area.margin;
                viewbox.w = area.w + 2*area.margin;
                viewbox.h = Math.floor((viewbox.w * area.limits.h) / area.limits.w);
                viewbox.y = area.min.y - ((viewbox.h - area.h) / 2);
            }
            else {
                // compute size based on height
                viewbox.y = area.min.y - area.margin;
                viewbox.h = area.h + 2*area.margin;
                viewbox.w = Math.floor((viewbox.h * area.limits.w) / area.limits.h);
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
        }
        // update DOM elements attributes
        this.setViewBox(viewbox.x, viewbox.y, viewbox.w, viewbox.h);
        this.setSize(svg.w, svg.h);
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

        let width = this.viewbox.width;
        let height = this.viewbox.height;
        let new_width = width * factor;
        let new_height = height * factor;
        let offset_x = (mouse.x - this.viewbox.x) * (factor-1);
        let offset_y = (mouse.y - this.viewbox.y) * (factor-1);
        this.setViewBox(round2Decimals(this.viewbox.x - offset_x),
                        round2Decimals(this.viewbox.y - offset_y),
                        round2Decimals(new_width),
                        round2Decimals(new_height));
        app.updateZoomView();
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

function Slider(svgslider) {
    this.svgslider = svgslider;
    this.value = 0.5;
    this.sliderline = document.querySelector("#sliderline");
    this.slidercircle = document.querySelector("#slidercircle");
    this.viewbox = null;
    this.getViewBox = function() {
        return this.viewbox;
    };
    this.setViewBox = function(x, y, width, height) {
        this.viewbox = { x: x, y: y, width: width, height: height };
        this.svgslider.setAttributeNS(null, "viewBox",
                    x + " " + y + " " + width + " " + height);
    };
    this.onStartDrag = function(mousePos) {
        console.log({ mouseStart:    mousePos.svg,
                 valueStart:    this.value });
        return { mouseStart:    mousePos.svg,
                 valueStart:    this.value };
    };
    this.onDrag = function(info, mousePos) {
        console.log(info, mousePos);
        // compute mouse offset
        let offset = mousePos.svg.y - info.mouseStart.y;
        // compute and set new value
        this.value = info.valueStart + offset / this.getSliderMaxY();
        this.value = Math.max(0, this.value);
        this.value = Math.min(1, this.value);
        // redraw
        this.redraw();
    };
    this.onEndDrag = function(info) {
    };
    this.autoSize = function() {
        let div = this.svgslider.parentNode;
        let viewbox = {}, area, component = { w: div.scrollWidth, h: div.scrollHeight }, c;
        // compute size to preserve aspect ratio
        viewbox.x = -5;
        viewbox.y = -5;
        viewbox.w = 10;
        viewbox.h = Math.floor((component.h * viewbox.w) / component.w);
        // update viewbox
        this.setViewBox(viewbox.x, viewbox.y, viewbox.w, viewbox.h);
        // redraw slider elements
        this.redraw();
    };
    this.getSliderMaxY = function() {
        return this.viewbox.height - 10;
    };
    this.redraw = function() {
        this.sliderline.setAttributeNS(null, 'd', "M0,0 L0," + this.getSliderMaxY());
        this.slidercircle.setAttributeNS(null, 'cy', this.value * this.getSliderMaxY());
    };
    let saved_this = this;
    this.slidercircle.addEventListener('mousedown', function(evt) {
                        svgStartDrag(evt, saved_this); });
}

function initSlider() {
    svgslider = document.querySelector("#svgslider");
    slider = new Slider(svgslider);
    return slider;
}

function Arrow(node1, node2) {
    this.node1 = node1;
    this.node2 = node2;
    this.paths = [];
    for (svg of document.querySelectorAll(".svggraph")) {
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

        for (path of this.paths) {
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

function App() {
    this.nodes = [];
    this.arrows = [];
    this.init = function() {
        netGraph = initNetGraph();
        zoomNetGraph = initZoomNetGraph();
        slider = initSlider();
        window.addEventListener('resize', this.autoSize);
        let autosizeButton = document.querySelector("#zoom-autosize-btn");
        let this_app = this;
        autosizeButton.onclick = function() { this_app.autoSize(); };
    };
    this.analyseAreaUsage = function(points, limits) {
        let area = {}, bounds;
        bounds = getMinMax(points);
        area.limits = limits;
        area.min = bounds.min;
        area.max = bounds.max;
        area.w = area.max.x - area.min.x;
        area.h = area.max.y - area.min.y;
        if (area.w/limits.w > area.h/limits.h) {
            area.limitation = 'width';
            area.margin = Math.floor(AUTOSIZE_MARGIN_PERCENT * area.w / 100);
            area.viewboxPixelSize = limits.w / (area.w + 2*area.margin);
        }
        else {
            area.limitation = 'height';
            area.margin = Math.floor(AUTOSIZE_MARGIN_PERCENT * area.h / 100);
            area.viewboxPixelSize = limits.h / (area.h + 2*area.margin);
        }
        return area;
    };
    this.autoScale = function() {
        let limits = netGraph.getContainerSize();
        let points = this.nodes.map(node => node.coordinates.user);
        let area = this.analyseAreaUsage(points, limits);
        let scaleFactor = area.viewboxPixelSize / EXPECTED_VIEWBOX_PIXEL_SIZE;
        let scaleCenter = { x: area.min.x + (area.w / 2), y: area.min.y + (area.h / 2) };
        for (node of this.nodes) {
            node.setScaling({ center: scaleCenter, factor: scaleFactor })
        }
    };
    this.autoSize = function() {
        // scale distance between nodes so that they appear with appropriate size
        this.autoScale();
        // resize main network view
        let limits = netGraph.getContainerSize();
        let points = this.nodes.map(node => node.coordinates.display);
        let areaInfo = this.analyseAreaUsage(points, limits);
        netGraph.resize(areaInfo, true);
        // resize zoom network view
        this.updateZoomView();
        // resize slider
        slider.autoSize();
    };
    this.updateZoomView = function() {
        let netGraphSize = netGraph.getContainerSize();
        let limits = { w: netGraphSize.w/5, h: netGraphSize.h/5 };  // 5 times smaller
        let points = this.nodes.map(node => node.coordinates.display);
        // zoomNetGraph viewbox should be large enough to show the zoom rectangle
        // we ensure this by adding two fake points (top-left and bottom-right of the rectangle)
        netGraph.updateZoomRect();
        let shape = zoomRect.getShape();
        points = points.concat([ { x: shape.x,
                                   y: shape.y },
                                 { x: shape.x + shape.width,
                                   y: shape.y + shape.height } ]);
        let areaInfo = this.analyseAreaUsage(points, limits);
        zoomNetGraph.resize(areaInfo, false);
    };
    this.addNode = function(x, y, label) {
        let n = new Node(x, y, label);
        this.nodes.push(n);
        return n;
    };
    this.addArrow = function(n1, n2) {
        let a = new Arrow(n1, n2);
        this.arrows.push(a);
        return a;
    };
    this.init();
}

function initJs() {

    app = new App();

    let n1 = app.addNode(250, 250, "N1");
    let n2 = app.addNode(350, 350, "N2");
    let n3 = app.addNode(250, 500, "N3");

    let arrow12 = app.addArrow(n1, n2);
    let arrow32 = app.addArrow(n3, n2);

    app.autoSize();

}
