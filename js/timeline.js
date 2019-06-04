
TIMELINE_ZOOM_FACTOR = 1.1;

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
    this.onNodeSelect = function() {
        this.node = this.app.nodes[this.combo.value];
        this.view.reselectDuplicate(this);
    };
    this.combo.onchange = function() { thisTimeline.onNodeSelect(); }
    this.updateNodes();
}

function TimelineView(app) {
    this.app = app;
    this.expanded = false;
    this.infos = null;
    this.timelines = [];
    this.timeRange = null;
    this.svgsContainer = document.querySelector(".node-timeline-svgs");

    this.expand = function() {
        this.expanded = true;
        displayOrHide("#timeline-box-expanded", true);
        displayOrHide("#timeline-box-reduced", false);
        this.autoSize();
        if (this.infos != null) {
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
        let firstSvg = this.svgsContainer.querySelector("svg"), svg;
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
            this.svgsContainer.appendChild(svg);
            combo = firstCombo.cloneNode(true);
            combosContainer.appendChild(combo);
            this.createTimeline(combo, svg);
            num += 1;
        }

        /* now remove rows until the timeline height is lower than half screen height */
        while (num > 0 && timelineBox.clientHeight > maxTimelineHeight) {
            this.svgsContainer.removeChild(this.svgsContainer.querySelector("svg:last-of-type"));
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

    this.onStartDrag = function(mousePos) {
        console.log('timeline start drag');
        let rect = this.svgsContainer.getBoundingClientRect();
        let factor = (this.infos.view.end - this.infos.view.begin) /
                     (rect.right - rect.left);
        return { mouseStartX: mousePos.pixels.x,
                 timeRangeStart: {
                    begin: this.infos.view.begin,
                    end: this.infos.view.end
                 },
                 factor: factor };
    };
    this.onDrag = function(info, mousePos) {
        // compute offset
        let xOffset = mousePos.pixels.x - info.mouseStartX;
        let timeOffset = xOffset * info.factor;
        // compute and set new time range
        this.infos.view.begin = info.timeRangeStart.begin - timeOffset;
        this.infos.view.end = info.timeRangeStart.end - timeOffset;
        console.log(mousePos.pixels.x, this.infos.view);
        // redraw
        this.updateContent();
    };
    this.onEndDrag = function(info) {
    };
    this.zoom = function(evt) {
        // compute zoom center (= mouse position)
        let timeRange = this.infos.view;
        let xCenter = getMousePosition(evt, null).pixels.x;
        let rect = this.svgsContainer.getBoundingClientRect();
        let ratioCenter = (xCenter - rect.left) / (rect.right - rect.left);
        let timeCenter = timeRange.begin + ratioCenter * (timeRange.end - timeRange.begin);
        // compute zoom factor
        let factor;
        if (evt.deltaY < 0) {
            factor = 1 / TIMELINE_ZOOM_FACTOR;
        }
        else {
            factor = TIMELINE_ZOOM_FACTOR;
        }
        // compute and set new time range
        timeRange.begin = timeCenter - factor * (timeCenter - timeRange.begin);
        timeRange.end = timeCenter + factor * (timeRange.end - timeCenter);
        // redraw
        this.updateContent();
    };
    let saved_this = this;
    this.svgsContainer.addEventListener('mousedown', function(evt) {
        if (saved_this.infos != null) {
            svgStartDrag(evt, saved_this);
        }
    });
    this.svgsContainer.addEventListener('wheel', function(evt) {
        if (saved_this.infos != null) {
            saved_this.zoom(evt);
        }
    });
    return this;
}

