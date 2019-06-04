
AUTOSIZE_MARGIN_PERCENT = 10;
EXPECTED_VIEWBOX_PIXEL_SIZE = 1.5;   // size in screen pixels of a viewbox unit

function App() {
    this.nodes = [];
    this.arrows = [];
    this.scaling = null;
    this.ws = null;
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
        this.ws = new WebSocket("ws://localhost:8080/websocket");
        this.ws.onerror = function() {
            console.log('ERROR');
        };
        this.ws.onopen = function() { this_app.onWebsocketOpen(); };
        this.ws.onmessage = function(evt) { this_app.onWebsocketMessage(evt); };
        this.autoSize();
    };
    this.onWebsocketOpen = function() {
        this.ws.send(JSON.stringify({ type: 'init' }));
    };
    this.onWebsocketMessage = function(evt) {
        let msg = JSON.parse(evt.data);
        console.log('ws message:', msg);
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
}

function initJs() {

    console.log('initJs started');

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
}

app = new App();
initJs();

console.log('app.js loaded');
