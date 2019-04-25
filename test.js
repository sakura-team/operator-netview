
NODE_RADIUS = 15;
ARROW_MARGIN = 7;
LABEL_OFFSET_Y = 6;
ARROW_MIN_LENGTH = 10;
DEFAULT_STROKE_WIDTH = 3;
ZOOM_FACTOR = 1.1;
AUTOSIZE_MARGIN = 50;

dragInfo = {
    elem: null
};

function round2Decimals(f) {
    return Math.round(f * 100) / 100;
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
    this.draggingOffset = null;
    this.linkedArrows = [];
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
    this.onStartDrag = function(mousePos) {
        let center = this.getCenter();
        let offset = {
            x: mousePos.svg.x - center.x,
            y: mousePos.svg.y - center.y
        };
        return { offset: offset };
    };
    this.onDrag = function(info, mousePos) {
        // move center
        this.setCenter({
            x: round2Decimals(mousePos.svg.x - info.offset.x),
            y: round2Decimals(mousePos.svg.y - info.offset.y),
        });
        // redraw linked arrows
        this.linkedArrows.forEach(function(arrow) {
            arrow.redraw();
        });
    };
    this.onEndDrag = function(info) {
    };
    this.getCenter = function() {
        return {
            x: parseInt(this.circles[0].getAttributeNS(null, 'cx'), 10),
            y: parseInt(this.circles[0].getAttributeNS(null, 'cy'), 10)
        };
    };
    this.setCenter = function(c) {
        for (circle of this.circles) {
            circle.setAttributeNS(null, 'cx', c.x);
            circle.setAttributeNS(null, 'cy', c.y);
        }
        for (text of this.texts) {
            text.setAttributeNS(null, 'x', c.x);
            text.setAttributeNS(null, 'y', c.y + LABEL_OFFSET_Y);
        }
    };
    this.setCenter({x: x, y: y});
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
    this.getSize = function() {
        return {
            width: this.svggraph.getAttributeNS(null, "width"),
            height: this.svggraph.getAttributeNS(null, "height")
        }
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
        updateZoomView();
    };
    this.onEndDrag = function(info) {
        this.svggraph.classList.remove("dragging");
    };
    this.autoSizeFillParent = function() {
        let div = this.svggraph.parentNode;
        this.autoSize(div.scrollWidth, div.scrollHeight, true, null);
    }
    this.autoSize = function(max_w, max_h, fill, areaBounds) {
        let viewbox = {}, area, component = {}, c;
        if (areaBounds == null) {
            areaBounds = { min: {x: null, y:null}, max: {x: null, y:null} };
        }
        area = areaBounds;

        // compute drawing area
        for (node of nodes) {
            c = node.getCenter();
            area.min.x = (area.min.x == null) ? c.x : Math.min(area.min.x, c.x);
            area.max.x = (area.max.x == null) ? c.x : Math.max(area.max.x, c.x);
            area.min.y = (area.min.y == null) ? c.y : Math.min(area.min.y, c.y);
            area.max.y = (area.max.y == null) ? c.y : Math.max(area.max.y, c.y);
        }
        area.min.x -= AUTOSIZE_MARGIN;
        area.min.y -= AUTOSIZE_MARGIN;
        area.max.x += AUTOSIZE_MARGIN;
        area.max.y += AUTOSIZE_MARGIN;
        area.w = area.max.x - area.min.x;
        area.h = area.max.y - area.min.y;
        // compute viewbox and component size
        if (fill) {
            component.w = max_w;
            component.h = max_h;
            // check whether we are more limited on width or on height
            if (area.w/max_w > area.h/max_h) {
                // compute size based on width
                viewbox.x = area.min.x;
                viewbox.w = area.w;
                viewbox.h = Math.floor((area.w * max_h) / max_w);
                viewbox.y = area.min.y - ((viewbox.h - area.h) / 2);
            }
            else {
                // compute size based on height
                viewbox.y = area.min.y;
                viewbox.h = area.h;
                viewbox.w = Math.floor((area.h * max_w) / max_h);
                viewbox.x = area.min.x - ((viewbox.w - area.w) / 2);
            }
        }
        else {
            // do not fill available room, preserve aspect ratio
            viewbox.x = area.min.x;
            viewbox.y = area.min.y;
            viewbox.w = area.w;
            viewbox.h = area.h;
            // check whether we are more limited on width or on height
            if (area.w/max_w > area.h/max_h) {
                // compute size based on width
                component.w = max_w;
                component.h = (area.h*component.w) / area.w;
            }
            else {
                // compute size based on height
                component.h = max_h;
                component.w = (area.w*component.h) / area.h;
            }
        }
        // update component attributes
        this.setViewBox(viewbox.x, viewbox.y, viewbox.w, viewbox.h);
        this.setSize(component.w, component.h);
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
        updateZoomView();
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
    this.getSize = function() {
        return {
            width: this.svgslider.getAttributeNS(null, "width"),
            height: this.svgslider.getAttributeNS(null, "height")
        }
    };
    this.setSize = function(width, height) {
        this.svgslider.setAttributeNS(null, "width", width);
        this.svgslider.setAttributeNS(null, "height", height);
    }
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

function updateZoomView() {
    netGraph.updateZoomRect();
    let netGraphSize = netGraph.getSize();
    // zoomNetGraph viewbox should be large enough to show the zoom rectangle
    let shape = zoomRect.getShape();
    let bounds = {  min: { x: shape.x,
                           y: shape.y },
                    max: { x: shape.x + shape.width,
                           y: shape.y + shape.height }
                 };
    zoomNetGraph.autoSize(netGraphSize.width/5, netGraphSize.height/5, false, bounds);
}

function autoSize() {
    netGraph.autoSizeFillParent();
    updateZoomView();
    slider.autoSize();
}

function initJs() {
    window.addEventListener('resize', autoSize);
    netGraph = initNetGraph();
    zoomNetGraph = initZoomNetGraph();
    slider = initSlider();

    let n1 = new Node(250, 250, "N1");
    let n2 = new Node(350, 350, "N2");
    let n3 = new Node(250, 500, "N3");

    nodes = [ n1, n2, n3 ];

    let arrow12 = new Arrow(n1, n2);
    let arrow32 = new Arrow(n3, n2);

    arrows = [ arrow12, arrow32 ];
    autoSize();
}
