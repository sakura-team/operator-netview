
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

function initSlider() {
    svgslider = document.querySelector("#svgslider");
    slider = new Slider(svgslider);
    return slider;
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

