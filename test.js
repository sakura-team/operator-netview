
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

function svgStartDrag(evt, node) {
    let mouse = getMousePosition(evt);
    let center = node.getCenter();
    dragInfo = {
        elem: node,
        offset: {
            x: mouse.x - center.x,
            y: mouse.y - center.y
        }
    };
    svggraph.addEventListener('mousemove', svgDrag);
    svggraph.addEventListener('mouseup', svgEndDrag);
    svggraph.addEventListener('mouseleave', svgEndDrag);
}

function svgDrag(evt) {
    evt.preventDefault();
    // move dragged element center
    let mouse = getMousePosition(evt);
    dragInfo.elem.setCenter({
        x: round2Decimals(mouse.x - dragInfo.offset.x),
        y: round2Decimals(mouse.y - dragInfo.offset.y),
    });
    // call element's custom callback
    dragInfo.elem.onDrag();
}

function svgEndDrag() {
    svggraph.removeEventListener('mousemove', svgDrag);
    svggraph.removeEventListener('mouseup', svgEndDrag);
    svggraph.removeEventListener('mouseleave', svgEndDrag);
}

function getMousePosition(evt) {
    let CTM = svggraph.getScreenCTM();
    return {
        x: (evt.clientX - CTM.e) / CTM.a,
        y: (evt.clientY - CTM.f) / CTM.d
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
    this.onDrag = function(evt) {
        // redraw linked arrows
        this.linkedArrows.forEach(function(arrow) {
            arrow.redraw();
        });
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
    this.getCenter = function() {
        return {
            x: parseInt(this.circles[0].getAttributeNS(null, 'cx'), 10),
            y: parseInt(this.circles[0].getAttributeNS(null, 'cy'), 10)
        };
    };
    this.setCenter({x: x, y: y});
    return this;
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

function sizeSvg(maxX, maxY) {
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
    svggraph.setAttributeNS(null, "viewBox", "0 0 " + viewbox_w + " " + viewbox_h);
    svggraph.setAttributeNS(null, "width", component_w);
    svggraph.setAttributeNS(null, "height", component_h);
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
    svggraph = document.querySelector("#svggraph");
    sizeSvg(500, 600);
    initZoomControls();

    let n1 = new Node(250, 250, "N1");
    let n2 = new Node(350, 350, "N2");
    let n3 = new Node(250, 500, "N3");

    nodes = [ n1, n2, n3 ];

    let arrow12 = new Arrow(n1, n2);
    let arrow32 = new Arrow(n3, n2);

    arrows = [ arrow12, arrow32 ];
}
