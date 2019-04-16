
NODE_RADIUS = 15;
ARROW_MARGIN = 7;
LABEL_OFFSET_Y = 6;
ARROW_MIN_LENGTH = 10;
DEFAULT_STROKE_WIDTH = 3;

dragInfo = {
    elem: null,
    offset: null
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
    let mousePos = getMousePosition(evt);
    let info = elem.onStartDrag(mousePos);
    dragInfo = {
        elem: elem,
        info: info
    };
    svggraph.addEventListener('mousemove', svgDrag);
    svggraph.addEventListener('mouseup', svgEndDrag);
    svggraph.addEventListener('mouseleave', svgEndDrag);
}

function svgDrag(evt) {
    evt.preventDefault();
    // call element's custom callback
    let mousePos = getMousePosition(evt);
    dragInfo.elem.onDrag(dragInfo.info, mousePos);
}

function svgEndDrag() {
    dragInfo.elem.onEndDrag(dragInfo.info);
    dragInfo.elem = null;
    svggraph.removeEventListener('mousemove', svgDrag);
    svggraph.removeEventListener('mouseup', svgEndDrag);
    svggraph.removeEventListener('mouseleave', svgEndDrag);
}

function pixelsToSvg(ctm, x, y) {
    if (ctm == null) {
        ctm = svggraph.getScreenCTM();
    }
    return {
        x: (x - ctm.e) / ctm.a,
        y: (y - ctm.f) / ctm.d
    }
}

function getMousePosition(evt) {
    return {
        pixels: {
            x: evt.clientX,
            y: evt.clientY
        },
        svg: pixelsToSvg(null, evt.clientX, evt.clientY)
    };
}

function Node(x, y, label) {
    this.circles = [];
    this.texts = [];
    this.draggingOffset = null;
    this.linkedArrows = [];
    let saved_this = this;
    for (svg of document.querySelectorAll("svg")) {
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

function NetGraph() {
    this.viewbox = null;
    this.getViewBox = function() {
        return this.viewbox;
    };
    this.setViewBox = function(x, y, width, height) {
        this.viewbox = { x: x, y: y, width: width, height: height };
        svggraph.setAttributeNS(null, "viewBox",
                    x + " " + y + " " + width + " " + height);
    };
    this.onStartDrag = function(mousePos) {
        svggraph.classList.add("dragging");
        return { mouseStart:    mousePos.svg,
                 ctm:           svggraph.getScreenCTM(),
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
    };
    this.onEndDrag = function(info) {
        svggraph.classList.remove("dragging");
    };
    this.resize = function(maxX, maxY) {
        let div = document.querySelector("#leftrow");
        let component_w = div.scrollWidth;
        let component_h = div.scrollHeight;
        let viewbox_w, viewbox_h;
        if (maxX/component_w > maxY/component_h) {
            // compute size based on width
            viewbox_w = maxX;
            viewbox_h = Math.floor((maxX * component_h) / component_w);
        }
        else {
            // compute size based on height
            viewbox_h = maxY;
            viewbox_w = Math.floor((maxY * component_w) / component_h);
        }
        this.setViewBox(0, 0, viewbox_w, viewbox_h);
        svggraph.setAttributeNS(null, "width", component_w);
        svggraph.setAttributeNS(null, "height", component_h);
    };
    let saved_this = this;
    svggraph.addEventListener('mousedown', function(evt) { svgStartDrag(evt, saved_this); });
    this.resize(500, 600);
}

function initNetGraph() {
    svggraph = document.querySelector("#svggraph");
    netGraph = new NetGraph();
    initZoomControls();
}

function Arrow(node1, node2) {
    this.node1 = node1;
    this.node2 = node2;
    this.paths = [];
    for (svg of document.querySelectorAll("svg")) {
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

function initZoomControls() {
    /* copy main svg content to small one of zoom controls */
    let svgContent = document.querySelector("#svgdiv").innerHTML;
    let zoomSvgdiv = document.querySelector("#zoom-svgdiv");
    zoomSvgdiv.innerHTML = svgContent;
    /* retrieve svg element */
    let zoomSvgGraph = zoomSvgdiv.getElementsByTagNameNS("http://www.w3.org/2000/svg", "svg")[0];
    /* update element ID */
    zoomSvgGraph.id = 'zoom-svggraph';
    /* resize */
    zoomSvgGraph.setAttributeNS(null, "class", "zoom-svggraph");
    zoomSvgGraph.setAttributeNS(null, "width", zoomSvgGraph.getAttributeNS(null, "width")/4);
    zoomSvgGraph.setAttributeNS(null, "height", zoomSvgGraph.getAttributeNS(null, "height")/4);
}

function initJs() {
    initNetGraph();

    let n1 = new Node(250, 250, "N1");
    let n2 = new Node(350, 350, "N2");
    let n3 = new Node(250, 500, "N3");

    nodes = [ n1, n2, n3 ];

    let arrow12 = new Arrow(n1, n2);
    let arrow32 = new Arrow(n3, n2);

    arrows = [ arrow12, arrow32 ];
}
