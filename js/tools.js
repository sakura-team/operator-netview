
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
    while (svg != null && svg.tagName != 'svg') {
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
    let position = {
        pixels: {
            x: evt.clientX,
            y: evt.clientY
        },
    };
    if (svg != null) {
        position.svg = pixelsToSvg(svg.getScreenCTM(), evt.clientX, evt.clientY);
    }
    return position;
}
