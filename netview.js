
console.log('netview.js started');
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
    if (f == 0) {
        return 0;
    }
    else if (f < 0) {
        return -round2Decimals(-f);
    }
    else {
        let factor = Math.pow(10, 2-Math.floor(Math.log10(f)));
        return Math.round(f * factor) / factor;
    }
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

function displayOrHide(selector, value) {
    let elem = document.querySelector(selector);
    if (value) {
        elem.classList.remove("no-display");
    }
    else {
        elem.classList.add("no-display");
    }
}

/* when scaling or zooming with center C and factor F, we can apply this obvious formula on a given point P:
     P'=C+F(P-C)
   but, to simplify & reduce calculations, we will compute:
     a=F
   and
     b=C-FC=C(1-F)
   thus the formula becomes:
     P'=aP+b
 */
function get_scaling_factors(scaling_info) {
    return {
        a: scaling_info.factor,
        b: {
            x: scaling_info.center.x * (1-scaling_info.factor),
            y: scaling_info.center.y * (1-scaling_info.factor)
        }
    };
}

/* apply P'=aP+b */
function scale(scaling, userCoordinates) {
    return {
        x: Math.floor(scaling.a * userCoordinates.x + scaling.b.x),
        y: Math.floor(scaling.a * userCoordinates.y + scaling.b.y)
    };
}

/* apply P=(P'-b)/a */
function unscale(scaling, displayCoordinates) {
    return {
        x: round2Decimals((displayCoordinates.x - scaling.b.x) / scaling.a),
        y: round2Decimals((displayCoordinates.y - scaling.b.y) / scaling.a)
    };
}

/* scaling parameters equivalent to applying 2 P'=aP+b transforms */
function aggregate_2_scalings(scaling1, scaling2) {
    return {
        a: scaling2.a * scaling1.a,
        b: {
            x: scaling2.a * scaling1.b.x + scaling2.b.x,
            y: scaling2.a * scaling1.b.y + scaling2.b.y,
        }
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
        return { mouseStart:    mousePos.svg,
                 valueStart:    this.value };
    };
    this.onDrag = function(info, mousePos) {
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

function Timeline(app, view, node, combo, svgtimeline) {
    this.app = app;
    this.view = view;
    this.node = node;
    this.combo = combo;
    this.svgtimeline = svgtimeline;
    this.range = null;
    let thisTimeline = this;
    this.updateNodes = function() {
        let options = this.combo.querySelectorAll("option");
        this.app.nodes.forEach(function(node, index){
            let option;
            if (index < options.length) {
                option = options[index];
            }
            else {
                option = options[0].cloneNode(true);
            }
            option.setAttribute("value", index);
            option.textContent = "node " + node.label;
            thisTimeline.combo.appendChild(option);
            if (node === thisTimeline.node) {
                thisTimeline.combo.value = index;
            }
        });
    };
    this.setNode = function(node) {
        let index = this.app.nodes.indexOf(node);
        this.combo.value = index;
        this.node = node;
    };
    this.clear = function() {
        let elements = this.svgtimeline.querySelectorAll(
                            ".node-timeline-send, .node-timeline-receive");
        for (elem of elements) {
            this.svgtimeline.removeChild(elem);
        }
    };
    this.add = function(type, start, end) {
        let elem = document.createElementNS('http://www.w3.org/2000/svg', "path");
        let cls, d, dStart, dEnd;
        if (type == "Rx") {
            cls = "node-timeline-receive";
        }
        else {
            cls = "node-timeline-send";
        }
        dStart = (start - this.range.begin) * 100 / (this.range.end - this.range.begin);
        dEnd = (end - this.range.begin) * 100 / (this.range.end - this.range.begin);
        d = 'M' + Math.round(dStart*1000)/1000 + ',-1 L' + Math.round(dEnd*1000)/1000 + ',-1';
        elem.setAttributeNS(null, 'class', cls);
        elem.setAttributeNS(null, 'd', d);
        this.svgtimeline.appendChild(elem);
    };
    this.setTimeRange = function(range) {
        this.range = range;
    };
    /*
    this.onStartDrag = function(mousePos) {
        return { mouseStart:    mousePos.svg,
                 valueStart:    this.value };
    };
    this.onDrag = function(info, mousePos) {
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
    };*/
    this.onNodeSelect = function() {
        this.node = this.app.nodes[this.combo.value];
        this.view.reselectDuplicate(this);
    };
    this.combo.onchange = function() { thisTimeline.onNodeSelect(); }
    this.updateNodes();
    this.svgtimeline.addEventListener('mousedown', function(evt) {
                        /*svgStartDrag(evt, thisTimeline);*/ console.log('TO DO'); });
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

function TraceView() {
    this.expanded = false;
    this.trInfos = null;

    this.expand = function() {
        this.expanded = true;
        displayOrHide("#traces-box-expanded", true);
        displayOrHide("#traces-box-reduced", false);
        this.autoSize();
        if (this.trInfos != null) {
            this.updateContent();
        }
    };

    this.reduce = function() {
        this.expanded = false;
        displayOrHide("#traces-box-expanded", false);
        displayOrHide("#traces-box-reduced", true);
    };

    this.update = function(trInfos) {
        this.trInfos = trInfos;
        if (this.expanded) {
            this.updateContent();
        }
    };

    this.updateContent = function() {
        let traceRows = document.querySelector("#tbodyTraces").querySelectorAll("tr");
        let traceRow, traceCells, rowStyles;

        this.trInfos.map(function(trInfo, i) {
            traceRow = traceRows[i];
            traceCells = traceRow.querySelectorAll("td");
            traceCells[0].textContent = trInfo.timestamp;
            traceCells[1].textContent = trInfo.node;
            traceCells[2].textContent = trInfo.message;
        });

        for (let i = 0; i < traceRows.length; i++) {
            rowStyles = traceRows[i].classList;
            if (i < this.trInfos.length) {
                rowStyles.remove('hidden-row');
            }
            else {
                rowStyles.add('hidden-row');
            }
        }
    }

    this.autoSize = function() {
        /* if window is minimized, exit */
        if (this.expanded == false) {
            return;
        }

        let tbodyTraces = document.querySelector("#tbodyTraces");
        let firstRow = tbodyTraces.querySelector("tr"), traceRow;
        let container = document.querySelector("#tablecol");

        /* try to append has much rows has possible until the
           container size overflows */
        while (container.scrollHeight == container.clientHeight) {
            traceRow = firstRow.cloneNode(true);
            traceRow.classList.add('hidden-row');
            tbodyTraces.appendChild(traceRow);
        }

        /* now remove rows until the container do not overflow anymore */
        while (container.scrollHeight != container.clientHeight) {
            if (tbodyTraces.querySelectorAll("tr").length == 1)
                break;
            tbodyTraces.removeChild(tbodyTraces.querySelector("tr:last-of-type"));
        }

        /* resize slider */
        slider.autoSize();
    };

    return this;
}

function TimelineView(app) {
    this.app = app;
    this.expanded = false;
    this.infos = null;
    this.timelines = [];
    this.timeRange = null;

    this.expand = function() {
        this.expanded = true;
        displayOrHide("#timeline-box-expanded", true);
        displayOrHide("#timeline-box-reduced", false);
        this.autoSize();
        if (this.trInfos != null) {
            this.updateContent();
        }
    };

    this.reduce = function() {
        this.expanded = false;
        displayOrHide("#timeline-box-expanded", false);
        displayOrHide("#timeline-box-reduced", true);
    };

    this.update = function(infos) {
        this.infos = infos;
        if (this.expanded) {
            this.updateContent();
        }
    };

    this.updateContent = function() {
        let timelinePerNodeLabel = {};
        let tl;
        for (tl of this.timelines) {
            timelinePerNodeLabel[tl.node.label] = tl;
            tl.clear();
        }
        this.setTimeRange();
        for (let evt of this.infos.events)
        {
            tl = timelinePerNodeLabel[evt.node];
            tl.add(evt.type, evt.begin, evt.end);
        }
    }

    this.setTimeRange = function() {
        for (tl of this.timelines) {
            tl.setTimeRange(this.infos.view);
        }
    };

    this.autoSize = function() {
        /* if window is minimized, exit */
        if (this.expanded == false) {
            return;
        }

        let timelineBox = document.querySelector("#timeline-box-expanded");
        let page = document.querySelector(".page");
        let maxTimelineHeight = page.scrollHeight / 2;
        let svgsContainer = document.querySelector(".node-timeline-svgs");
        let firstSvg = svgsContainer.querySelector("svg"), svg;
        let combosContainer = document.querySelector(".node-selectors");
        let firstCombo = combosContainer.querySelector("select"), combo;
        let num = combosContainer.querySelectorAll("select").length;

        /* if we have nodes for the first time, init first timeline */
        if (this.app.nodes.length > 0 && this.timelines.length == 0) {
            firstSvg.classList.remove('no-display');
            firstCombo.classList.remove('no-display');
            this.createTimeline(firstCombo, firstSvg);
        }

        /* try to have one timeline for each node unless the timeline box reaches half screen height */
        for (let i = num; i < this.app.nodes.length; i++) {
            if (timelineBox.clientHeight > maxTimelineHeight) {
                break;
            }
            svg = firstSvg.cloneNode(true);
            svgsContainer.appendChild(svg);
            combo = firstCombo.cloneNode(true);
            combosContainer.appendChild(combo);
            this.createTimeline(combo, svg);
            num += 1;
        }

        /* now remove rows until the timeline height is lower than half screen height */
        while (num > 0 && timelineBox.clientHeight > maxTimelineHeight) {
            svgsContainer.removeChild(svgsContainer.querySelector("svg:last-of-type"));
            combosContainer.removeChild(combosContainer.querySelector("select:last-of-type"));
            this.timelines.pop();
            num -= 1;
        }
    };

    this.getDefaultTimelineNode = function() {
        /* When we create a new timeline, we select a node
           that is not currently selected by another timeline.
           Then we sort possible nodes by their label and return
           the first one.
        */
        let nodes = new Set(this.app.nodes);
        for (let timeline of this.timelines)
        {
            nodes.delete(timeline.node);
        }
        let sortedNodes = Array.from(nodes).sort(function(n1, n2) {
            return n1.label.localeCompare(n2.label);
        });
        return sortedNodes[0];
    };

    this.createTimeline = function(combo, svg) {
        let node = this.getDefaultTimelineNode();
        this.timelines.push(new Timeline(this.app, this, node, combo, svg));
    };

    this.updateNodes = function() {
        for (let timeline of this.timelines) {
            timeline.updateNodes();
        }
    };

    this.reselectDuplicate = function(tl) {
        for (let timeline of this.timelines) {
            if (tl === timeline) {
                continue;
            }
            if (tl.node !== timeline.node) {
                continue;
            }
            // if we are here we have a duplicate
            let node = this.getDefaultTimelineNode();
            timeline.setNode(node);
        }
    };

    return this;
}

function App() {
    this.nodes = [];
    this.arrows = [];
    this.scaling = null;
    this.init = function() {
        let autosizeButton = document.querySelector("#zoom-autosize-btn");
        let this_app = this;
        netGraph = initNetGraph();
        zoomNetGraph = initZoomNetGraph();
        traceview = new TraceView();
        slider = initSlider();
        timelineView = new TimelineView(this);
        window.addEventListener('resize', function() { this_app.autoSize(); });
        autosizeButton.onclick = function() { this_app.autoSize(); };
    };
    this.analyseAreaUsage = function(points, limits) {
        let area = {}, bounds;
        area.limits = limits;
        if (points.length == 0) {
            // no points
            area.min = { x: 0, y: 0 };
            area.max = { x: 0, y: 0 };
        }
        else {
            // 2 points or more
            bounds = getMinMax(points);
            area.min = bounds.min;
            area.max = bounds.max;
        }
        area.w = area.max.x - area.min.x;
        area.h = area.max.y - area.min.y;
        if (area.w == 0 && area.h == 0) {
            // 0 or 1 point
            if (limits.w < limits.h) {
                area.limitation = 'width';
                area.margin = limits.w / 2 / EXPECTED_VIEWBOX_PIXEL_SIZE;
            }
            else {
                area.limitation = 'height';
                area.margin = limits.h / 2 / EXPECTED_VIEWBOX_PIXEL_SIZE;
            }
            area.viewboxPixelSize = EXPECTED_VIEWBOX_PIXEL_SIZE;
        }
        else {
            if (area.w/limits.w > area.h/limits.h) {
                area.limitation = 'width';
                area.margin = AUTOSIZE_MARGIN_PERCENT * area.w / 100;
                area.viewboxPixelSize = limits.w / (area.w + 2*area.margin);
            }
            else {
                area.limitation = 'height';
                area.margin = AUTOSIZE_MARGIN_PERCENT * area.h / 100;
                area.viewboxPixelSize = limits.h / (area.h + 2*area.margin);
            }
        }
        return area;
    };
    this.setScaling = function(scaling) {
        this.scaling = scaling;
        for (let node of this.nodes) {
            node.setScaling(scaling);
        }
    };
    this.autoScale = function() {
        let limits = netGraph.getContainerSize();
        let points = this.nodes.map(node => node.coordinates.user);
        let area = this.analyseAreaUsage(points, limits);
        let scaleFactor = area.viewboxPixelSize / EXPECTED_VIEWBOX_PIXEL_SIZE;
        let scaleCenter = { x: area.min.x + (area.w / 2), y: area.min.y + (area.h / 2) };
        let scaling = get_scaling_factors({ center: scaleCenter, factor: scaleFactor });
        this.setScaling(scaling);
    };
    this.autoSize = function() {
        // resize trace view
        traceview.autoSize();
        // scale distance between nodes so that they appear with appropriate size
        this.autoScale();
        // resize main network view
        let limits = netGraph.getContainerSize();
        let points = this.nodes.map(node => node.coordinates.display);
        let areaInfo = this.analyseAreaUsage(points, limits);
        netGraph.resize(areaInfo, true);
        // resize zoom network view
        this.updateZoomView();
        // resize timeline view
        timelineView.autoSize();
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
    this.zoom = function(zoom_info) {
        let zoom_scaling = get_scaling_factors(zoom_info);
        let scaling = aggregate_2_scalings(this.scaling, zoom_scaling);
        this.setScaling(scaling);
        this.updateZoomView();
    };
    this.addNode = function(x, y, label) {
        let n = new Node(x, y, label);
        this.nodes.push(n);
        this.autoSize();
        timelineView.updateNodes();
        return n;
    };
    this.addArrow = function(n1, n2) {
        let a = new Arrow(n1, n2);
        this.arrows.push(a);
        return a;
    };
    this.zoomBoxExpand = function() {
        displayOrHide("#zoom-box-content", true);
        displayOrHide("#zoom-box-expand", false);
        displayOrHide("#zoom-box-reduce", true);
    };
    this.zoomBoxReduce = function() {
        displayOrHide("#zoom-box-content", false);
        displayOrHide("#zoom-box-expand", true);
        displayOrHide("#zoom-box-reduce", false);
    };
    this.tracesBoxExpand = function() {
        traceview.expand();
    };
    this.tracesBoxReduce = function() {
        traceview.reduce();
    };
    this.timelineBoxExpand = function() {
        timelineView.expand();
    };
    this.timelineBoxReduce = function() {
        timelineView.reduce();
    };
    this.init();
}

function initJs() {

    console.log('initJs started');
    app = new App();

    setTimeout(function(){ n1 = app.addNode(250, 250, "N1"); }, 3000);
    setTimeout(function(){ n2 = app.addNode(352, 252, "N2"); }, 6000);
    setTimeout(function(){ n3 = app.addNode(250, 500, "N3"); }, 9000);
    setTimeout(function(){ n4 = app.addNode(750, 150, "N4"); }, 12000);

    setTimeout(function(){ arrow12 = app.addArrow(n1, n2); }, 10000);
    setTimeout(function(){ arrow32 = app.addArrow(n3, n2); }, 12500);

    setTimeout(function(){ traceview.update([
        {
            timestamp: 1557126305.919,
            node: 'N2',
            message: 'MoveTo: 223 555'
        },
        {
            timestamp: 1557126305.985,
            node: 'N2',
            message: 'Ended experiment'
        },
        {
            timestamp: 1557126306.352,
            node: 'N1',
            message: 'OK sent'
        }
    ]); }, 500);

    setTimeout(function(){ timelineView.update({
        view: {
            begin: 1557126302.334,
            end: 1557126307.366
        },
        events: [
            {
                type: 'Tx',
                node: 'N2',
                begin: 1557126305.334,
                end: 1557126305.366
            },
            {
                type: 'Rx',
                node: 'N1',
                begin: 1557126305.338,
                end: 1557126305.370
            },
            {
                type: 'Tx',
                node: 'N3',
                begin: 1557126306.334,
                end: 1557126306.366
            },
            {
                type: 'Rx',
                node: 'N1',
                begin: 1557126306.338,
                end: 1557126306.370
            }
        ]}
    ); }, 12500);

    var ws = new WebSocket("ws://localhost:8080/websocket");
    ws.onopen = function() {
        ws.send("Hello, world");
    };
    ws.onmessage = function (evt) {
        console.log('ws message:', evt.data);
    };

    app.autoSize();
}

console.log('netview.js loaded');
