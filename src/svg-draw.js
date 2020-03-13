/*
 * MAIN CANVAS AND DEFINITIONS
 */
var svg = document.querySelector('.js-svg');
var svgns = "http://www.w3.org/2000/svg";
var globalElements = {
    main: document.querySelector('main')
};
var NON_TEXT_KEYS = [
    'Alt',
    'Dead',
    'Meta',
    'Shift',
    'Enter',
    'Control',
    'ArrowUp',
    'ArrowDown',
    'ArrowLeft',
    'ArrowRight'
];
var DEFAULT_FONT_SIZE = 18;
var RESIZE_RECTANGLE_LENGTH = 10;
var DEFAULT_LINE_WIDTH = 5;
/*
 * CONTROLS
 */
var xSize = document.querySelector('.js-size-x');
var ySize = document.querySelector('.js-size-y');
/*
 * GLOBAL STATE
 */
// TODO(Fede): Everything should be moved into the global state object
var currentElement = null;
var movementInitCoords = null;
var globalState = {
    currentAction: null
};
// movement
var isMovingElement = false;
// resize
var isResizingDown = false;
var isResizingUp = false;
var isResizingRight = false;
var isResizingLeft = false;
var isResizingPoint1 = false;
var isResizingPoint2 = false;
/*
 * EVENT LISTENERS FOR CONTROLS
 */
document.body.addEventListener('click', handleUserClick);
document.body.addEventListener('mousemove', handleUserMousemove);
document.body.addEventListener('mouseup', handleUserMouseup);
document.body.addEventListener('keydown', handleUserKeydown);
xSize.addEventListener('change', function (e) { return svg.setAttribute('width', xSize.value); });
ySize.addEventListener('change', function (e) { return svg.setAttribute('height', ySize.value); });
/*
 * EVENT HANDLER
 */
function handleUserKeydown(e) {
    if (currentElement !== null) {
        //TODO(Fede): maybe current Action can't be null and always has an action type?
        var actionType = globalState.currentAction ? globalState.currentAction.type : "none";
        switch (actionType) {
            case "initialInsert":
                if (globalState.currentAction.target.localName === "text") {
                    if (!arrayIncludes(NON_TEXT_KEYS, e.key)) {
                        e.preventDefault();
                        currentElement.textContent = addKeyInput("", e.key);
                        globalState.currentAction = { type: "inserting", target: currentElement };
                        currentElement.setAttribute('fill', 'black');
                        placeSelectBox();
                    }
                }
                break;
            case "inserting":
                if (globalState.currentAction.target.localName === "text") {
                    if (!arrayIncludes(NON_TEXT_KEYS, e.key)) {
                        e.preventDefault();
                        var currentText = currentElement.textContent;
                        var newText = addKeyInput(currentText, e.key);
                        currentElement.textContent = newText;
                        placeSelectBox();
                    }
                }
                break;
            default:
                // Delete current element
                if ((e.keyCode === 8 || e.keyCode === 46)) {
                    e.preventDefault();
                    removeElement(currentElement);
                    currentElement = null;
                    placeSelectBox();
                }
        }
    }
}
function handleUserClick(e) {
    var itemType = e.target.getAttribute('data-item') || null;
    console.log(itemType);
    if (itemType) {
        e.preventDefault();
    }
    if (itemType == 'download') {
        download();
    }
    if (globalState.currentAction) {
        // Handle current action
        var actionType = globalState.currentAction.type;
        switch (actionType) {
            case "beforeInsert":
                {
                    var object = globalState.currentAction.object;
                    switch (object) {
                        case "line":
                            {
                                var svgCoords = svg.getBoundingClientRect();
                                var relativeX = e.clientX - svgCoords.x;
                                var relativeY = e.clientY - svgCoords.y;
                                var maxX = svgCoords.width;
                                var maxY = svgCoords.height;
                                var minX = 0;
                                var minY = 0;
                                var isInsideSvg = relativeX >= minX && relativeX <= maxX && relativeX >= minY && relativeY <= maxY;
                                if (isInsideSvg) {
                                    var line = document.createElementNS(svgns, 'line');
                                    line.setAttribute('x1', relativeX.toString());
                                    line.setAttribute('y1', relativeY.toString());
                                    line.setAttribute('x2', relativeX.toString());
                                    line.setAttribute('y2', relativeY.toString());
                                    line.setAttribute('stroke', 'black');
                                    line.setAttribute('stroke-width', DEFAULT_LINE_WIDTH.toString());
                                    line.setAttribute('data-item', 'element');
                                    globalState.currentAction = { type: "inserting", target: line };
                                    svg.appendChild(line);
                                }
                            }
                            break;
                        case "rect":
                            {
                                var svgCoords = svg.getBoundingClientRect();
                                var relativeX = e.clientX - svgCoords.x;
                                var relativeY = e.clientY - svgCoords.y;
                                var maxX = svgCoords.width;
                                var maxY = svgCoords.height;
                                var minX = 0;
                                var minY = 0;
                                var isInsideSvg = relativeX >= minX && relativeX <= maxX && relativeX >= minY && relativeY <= maxY;
                                if (isInsideSvg) {
                                    var rect = document.createElementNS(svgns, 'rect');
                                    rect.setAttribute('height', '0');
                                    rect.setAttribute('width', '0');
                                    rect.setAttribute('x', relativeX.toString());
                                    rect.setAttribute('y', relativeY.toString());
                                    rect.setAttribute('fill', 'transparent');
                                    rect.setAttribute('stroke', 'black');
                                    rect.setAttribute('stroke-width', DEFAULT_LINE_WIDTH.toString());
                                    rect.setAttribute('data-item', 'element');
                                    globalState.currentAction = {
                                        type: "inserting",
                                        target: rect,
                                        initialCoords: { x: relativeX, y: relativeY }
                                    };
                                    svg.appendChild(rect);
                                }
                            }
                            break;
                        case "text":
                            {
                                var svgCoords = svg.getBoundingClientRect();
                                var relativeX = e.clientX - svgCoords.x;
                                var relativeY = e.clientY - svgCoords.y + DEFAULT_FONT_SIZE;
                                var maxX = svgCoords.width;
                                var maxY = svgCoords.height;
                                var minX = 0;
                                var minY = DEFAULT_FONT_SIZE;
                                if (relativeX >= minX && relativeX <= maxX && relativeX >= minY && relativeY <= maxY) {
                                    var text = document.createElementNS(svgns, 'text');
                                    text.setAttribute('x', relativeX.toString());
                                    text.setAttribute('y', relativeY.toString());
                                    text.setAttribute('fill', 'blue');
                                    text.setAttribute('data-item', 'element');
                                    text.setAttribute('style', "font-size: " + DEFAULT_FONT_SIZE + "px");
                                    text.textContent = 'Enter text';
                                    currentElement = text;
                                    globalState.currentAction = { type: 'initialInsert', target: text };
                                    svg.appendChild(text);
                                    placeSelectBox();
                                }
                            }
                            break;
                    }
                }
                break;
            case 'inserting':
                {
                    globalState.currentAction = null;
                }
                break;
        }
    }
    else {
        // Handle Element click
        switch (itemType) {
            case 'element':
                handleElementClick(e.target);
                break;
            case 'selector':
                break;
            case 'resize':
                break;
            case 'insert':
                currentElement = null;
                var element = e.target.getAttribute('data-element') || null;
                if (element) {
                    globalState.currentAction = { type: 'beforeInsert', object: element };
                }
                placeSelectBox();
                break;
            default:
                // Deselect if target is not an item
                currentElement = null;
                globalState.currentAction = null;
                placeSelectBox();
        }
    }
    // Main status according to current action
    if (globalState.currentAction && globalState.currentAction.type == "beforeInsert") {
        globalElements.main.className = 'main--before-insert';
    }
    else {
        globalElements.main.className = '';
    }
}
function handleUserMousemove(e) {
    if (currentElement) {
        e.preventDefault();
    }
    // TODO(fede): Wrap this in case statement to handle current action
    var currentActionType = globalState.currentAction ? globalState.currentAction.type : null;
    if (currentActionType === "inserting") {
        var target = globalState.currentAction.target;
        var svgCoords = svg.getBoundingClientRect();
        var relativeX = e.clientX - svgCoords.x;
        var relativeY = e.clientY - svgCoords.y;
        switch (target.nodeName) {
            case "line":
                {
                    var minX = 0;
                    var maxX = parseInt(svg.getAttribute('width'));
                    var minY = 0;
                    var maxY = parseInt(svg.getAttribute('height'));
                    var newX = capToBoundaries(relativeX, minX, maxX);
                    var newY = capToBoundaries(relativeY, minY, maxY);
                    var line = globalState.currentAction.target;
                    line.setAttribute('x1', newX.toString());
                    line.setAttribute('y1', newY.toString());
                }
                break;
            case "rect":
                {
                    var minX = DEFAULT_LINE_WIDTH;
                    var maxX = parseInt(svg.getAttribute('width')) - DEFAULT_LINE_WIDTH;
                    var minY = DEFAULT_LINE_WIDTH;
                    var maxY = parseInt(svg.getAttribute('height')) - DEFAULT_LINE_WIDTH;
                    var initialCoords = globalState.currentAction.initialCoords;
                    var x = initialCoords.x;
                    var y = initialCoords.y;
                    relativeX = capToBoundaries(relativeX, minX, maxX);
                    relativeY = capToBoundaries(relativeY, minY, maxY);
                    var newX = Math.min(x, relativeX);
                    var newY = Math.min(y, relativeY);
                    var widthVal = relativeX - x;
                    var newWidth = widthVal > 0 ? widthVal : -widthVal;
                    var heightVal = relativeY - y;
                    var newHeight = heightVal > 0 ? heightVal : -heightVal;
                    target.setAttribute('x', newX.toString());
                    target.setAttribute('width', newWidth.toString());
                    target.setAttribute('y', newY.toString());
                    target.setAttribute('height', newHeight.toString());
                }
                break;
        }
    }
    // Move element
    if (currentElement && isMovingElement) {
        switch (currentElement.localName) {
            case "line":
                {
                    movementInitCoords = movementInitCoords || {
                        clientX: e.clientX,
                        clientY: e.clientY,
                        elementX1: parseInt(currentElement.getAttribute('x1')),
                        elementY1: parseInt(currentElement.getAttribute('y1')),
                        elementX2: parseInt(currentElement.getAttribute('x2')),
                        elementY2: parseInt(currentElement.getAttribute('y2'))
                    };
                    var mouseDiff = {
                        x: e.clientX - movementInitCoords.clientX,
                        y: e.clientY - movementInitCoords.clientY
                    };
                    //NOTE(fede): this refers to the max value a point can have and not the actual x and
                    // y values of the svg element as done with other elements
                    var minX = 0;
                    var maxX = parseInt(svg.getAttribute('width'));
                    ;
                    var minY = 0;
                    var maxY = parseInt(svg.getAttribute('height'));
                    var minPointX = Math.min(movementInitCoords.elementX1, movementInitCoords.elementX2);
                    var minPointY = Math.min(movementInitCoords.elementY1, movementInitCoords.elementY2);
                    var maxPointX = Math.max(movementInitCoords.elementX1, movementInitCoords.elementX2);
                    var maxPointY = Math.max(movementInitCoords.elementY1, movementInitCoords.elementY2);
                    var maxDiffX = maxX - maxPointX;
                    var minDiffX = minX - minPointX;
                    var maxDiffY = maxY - maxPointY;
                    var minDiffY = minY - minPointY;
                    var movementDiff = {
                        x: Math.min(maxDiffX, Math.max(minDiffX, mouseDiff.x)),
                        y: Math.min(maxDiffY, Math.max(minDiffY, mouseDiff.y))
                    };
                    var newPositions = {
                        x1: movementInitCoords.elementX1 + movementDiff.x,
                        y1: movementInitCoords.elementY1 + movementDiff.y,
                        x2: movementInitCoords.elementX2 + movementDiff.x,
                        y2: movementInitCoords.elementY2 + movementDiff.y
                    };
                    // Set new position
                    currentElement.setAttribute('x1', newPositions.x1);
                    currentElement.setAttribute('y1', newPositions.y1);
                    currentElement.setAttribute('x2', newPositions.x2);
                    currentElement.setAttribute('y2', newPositions.y2);
                    placeSelectBox();
                }
                break;
            case "text":
                {
                    movementInitCoords = movementInitCoords || {
                        clientX: e.clientX,
                        clientY: e.clientY,
                        elementX: parseInt(currentElement.getAttribute('x')),
                        elementY: parseInt(currentElement.getAttribute('y'))
                    };
                    var diff = {
                        x: e.clientX - movementInitCoords.clientX,
                        y: e.clientY - movementInitCoords.clientY
                    };
                    var relativeCoords = getRelativeCoords(currentElement);
                    // Get new x/y values
                    var borderWidth = parseInt(currentElement.getAttribute('stroke-width') || 0);
                    var minX = 0 + borderWidth;
                    var maxX = parseInt(svg.getAttribute('width')) - borderWidth - relativeCoords.width;
                    var minY = 0 + borderWidth + DEFAULT_FONT_SIZE;
                    var maxY = parseInt(svg.getAttribute('height')) - relativeCoords.height - borderWidth + DEFAULT_FONT_SIZE;
                    var targetX = movementInitCoords.elementX + diff.x;
                    var newX = Math.min(maxX, Math.max(minX, targetX));
                    var targetY = movementInitCoords.elementY + diff.y;
                    var newY = Math.min(maxY, Math.max(minY, targetY));
                    // Set new position
                    currentElement.setAttribute('x', newX);
                    currentElement.setAttribute('y', newY);
                    placeSelectBox();
                }
                break;
            default: {
                movementInitCoords = movementInitCoords || {
                    clientX: e.clientX,
                    clientY: e.clientY,
                    elementX: parseInt(currentElement.getAttribute('x')),
                    elementY: parseInt(currentElement.getAttribute('y'))
                };
                var diff = {
                    x: e.clientX - movementInitCoords.clientX,
                    y: e.clientY - movementInitCoords.clientY
                };
                var relativeCoords = getRelativeCoords(currentElement);
                // Get new x/y values
                var borderWidth = parseInt(currentElement.getAttribute('stroke-width') || 0);
                var minX = 0 + borderWidth;
                var maxX = parseInt(svg.getAttribute('width')) - borderWidth - relativeCoords.width;
                var minY = 0 + borderWidth;
                var maxY = parseInt(svg.getAttribute('height')) - relativeCoords.height - borderWidth;
                var targetX = movementInitCoords.elementX + diff.x;
                var newX = Math.min(maxX, Math.max(minX, targetX));
                var targetY = movementInitCoords.elementY + diff.y;
                var newY = Math.min(maxY, Math.max(minY, targetY));
                // Set new position
                currentElement.setAttribute('x', newX);
                currentElement.setAttribute('y', newY);
                placeSelectBox();
            }
        }
    }
    // Resize Vertically
    if (currentElement && isResizingUp) {
        movementInitCoords = movementInitCoords || {
            clientY: e.clientY,
            elementY: parseInt(currentElement.getAttribute('y')),
            elementHeight: parseInt(currentElement.getAttribute('height'))
        };
        var diff = {
            y: movementInitCoords.clientY - e.clientY
        };
        // Set new height value
        var borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
        var targetHeight = movementInitCoords.elementHeight + diff.y;
        var maxHeight = void 0;
        var minHeight = 1;
        var newHeight = void 0;
        if (targetHeight >= 0) {
            // upwards resize (move y up and make larger)
            var targetY = movementInitCoords.elementY - diff.y;
            if (targetY >= 0) {
                currentElement.setAttribute('y', targetY);
                currentElement.setAttribute('height', targetHeight);
            }
        }
        else {
            // downwards resize (make element larger keeping y)
            maxHeight = parseInt(svg.getAttribute('height')) - parseInt(currentElement.getAttribute('y')) - borderWidth;
            newHeight = Math.min(maxHeight, Math.max(minHeight, -targetHeight));
            currentElement.setAttribute('height', newHeight);
        }
        placeSelectBox();
    }
    if (currentElement && isResizingDown) {
        movementInitCoords = movementInitCoords || {
            clientY: e.clientY,
            elementY: parseInt(currentElement.getAttribute('y')),
            elementHeight: parseInt(currentElement.getAttribute('height'))
        };
        var diff = {
            y: e.clientY - movementInitCoords.clientY
        };
        // Set new height value
        var borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
        var targetHeight = movementInitCoords.elementHeight + diff.y;
        var maxHeight = void 0;
        var minHeight = 1;
        var newHeight = void 0;
        if (targetHeight >= 0) {
            // downwards resize (make element larger keeping y)
            maxHeight = parseInt(svg.getAttribute('height')) - parseInt(currentElement.getAttribute('y')) - borderWidth;
            newHeight = Math.min(maxHeight, Math.max(minHeight, targetHeight));
            currentElement.setAttribute('height', newHeight);
        }
        else {
            // upwards resize (move y up and make larger)
            var targetY = movementInitCoords.elementY + targetHeight;
            if (targetY >= 0) {
                currentElement.setAttribute('y', targetY);
                currentElement.setAttribute('height', -targetHeight);
            }
        }
        placeSelectBox();
    }
    if (currentElement && isResizingRight) {
        movementInitCoords = movementInitCoords || {
            clientX: e.clientX,
            elementX: parseInt(currentElement.getAttribute('x')),
            elementWidth: parseInt(currentElement.getAttribute('width'))
        };
        var diff = {
            x: e.clientX - movementInitCoords.clientX
        };
        // Set new width value
        var borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
        var targetWidth = movementInitCoords.elementWidth + diff.x;
        var maxWidth = void 0;
        var minWidth = 1;
        var newWidth = void 0;
        if (targetWidth >= 0) {
            // right resize (make element larger keeping x)
            maxWidth = parseInt(svg.getAttribute('width')) - parseInt(currentElement.getAttribute('x')) - borderWidth;
            newWidth = Math.min(maxWidth, Math.max(minWidth, targetWidth));
            currentElement.setAttribute('width', newWidth);
        }
        else {
            // left resize (move x left and make larger)
            var targetX = movementInitCoords.elementX + targetWidth;
            // Ignore transform if implies going outside the canvass
            if (targetX >= 0) {
                currentElement.setAttribute('x', targetX);
                currentElement.setAttribute('width', -targetWidth);
            }
        }
        placeSelectBox();
    }
    if (currentElement && isResizingLeft) {
        movementInitCoords = movementInitCoords || {
            clientX: e.clientX,
            elementX: parseInt(currentElement.getAttribute('x')),
            elementWidth: parseInt(currentElement.getAttribute('width'))
        };
        var diff = {
            x: movementInitCoords.clientX - e.clientX
        };
        // Set new width value
        var borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
        var targetWidth = movementInitCoords.elementWidth + diff.x;
        var maxWidth = void 0;
        var minWidth = 1;
        var newWidth = void 0;
        if (targetWidth >= 0) {
            // left resize (move x left and make larger)
            var targetX = movementInitCoords.elementX - diff.x;
            // Ignore transform if implies going outside the canvass
            if (targetX >= 0) {
                currentElement.setAttribute('x', targetX);
                currentElement.setAttribute('width', Math.max(targetWidth, minWidth));
            }
        }
        else {
            // right resize (make element larger keeping x)
            maxWidth = parseInt(svg.getAttribute('width')) - parseInt(currentElement.getAttribute('x')) - borderWidth;
            newWidth = Math.min(maxWidth, Math.max(minWidth, -targetWidth));
            currentElement.setAttribute('width', newWidth);
        }
        placeSelectBox();
    }
    // Resize Line by Points
    if (currentElement && isResizingPoint1) {
        var svgCoords = svg.getBoundingClientRect();
        var relativeX = e.clientX - svgCoords.x;
        var relativeY = e.clientY - svgCoords.y;
        var minX = 0;
        var maxX = parseInt(svg.getAttribute('width'));
        ;
        var minY = 0;
        var maxY = parseInt(svg.getAttribute('height'));
        var newX = capToBoundaries(relativeX, minX, maxX);
        var newY = capToBoundaries(relativeY, minY, maxY);
        var line = currentElement;
        line.setAttribute('x1', newX.toString());
        line.setAttribute('y1', newY.toString());
        placeSelectBox();
    }
    if (currentElement && isResizingPoint2) {
        var svgCoords = svg.getBoundingClientRect();
        var relativeX = e.clientX - svgCoords.x;
        var relativeY = e.clientY - svgCoords.y;
        var minX = 0;
        var maxX = parseInt(svg.getAttribute('width'));
        ;
        var minY = 0;
        var maxY = parseInt(svg.getAttribute('height'));
        var newX = capToBoundaries(relativeX, minX, maxX);
        var newY = capToBoundaries(relativeY, minY, maxY);
        var line = currentElement;
        line.setAttribute('x2', newX.toString());
        line.setAttribute('y2', newY.toString());
        placeSelectBox();
    }
}
function handleElementClick(element) {
    selectElement(element);
}
function handleElementMousedown(e) {
    var itemType = e.target.getAttribute('data-item') || null;
    if (itemType === 'selector') {
        isMovingElement = true;
    }
    if (itemType === 'resize') {
        var resizeDirection = e.target.getAttribute('data-location') || null;
        if (resizeDirection === "down") {
            isResizingDown = true;
        }
        if (resizeDirection === "up") {
            isResizingUp = true;
        }
        if (resizeDirection === "right") {
            isResizingRight = true;
        }
        if (resizeDirection === "left") {
            isResizingLeft = true;
        }
        if (resizeDirection === "point1") {
            isResizingPoint1 = true;
        }
        if (resizeDirection === "point2") {
            isResizingPoint2 = true;
        }
    }
}
function handleUserMouseup(e) {
    // Reset all mousemove related state
    isMovingElement = false;
    movementInitCoords = null;
    isResizingDown = false;
    isResizingUp = false;
    isResizingRight = false;
    isResizingLeft = false;
    isResizingPoint1 = false;
    isResizingPoint2 = false;
    placeSelectBox();
}
/*
 * ACTIONS
 */
function selectElement(element) {
    // Set current element
    currentElement = element;
    removeSelectBox();
    placeSelectBox();
}
function placeSelectBox() {
    if (currentElement) {
        var padding = 5;
        var dimensions = currentElement.getBoundingClientRect();
        var intCoords = getAbsoluteCoords(currentElement);
        switch (currentElement.localName) {
            case "text":
                {
                    // Set box dimensions
                    var boxX = intCoords.x - padding / 2;
                    var boxY = intCoords.y - DEFAULT_FONT_SIZE;
                    var boxWidth = dimensions.width + padding;
                    var boxHeight = padding + DEFAULT_FONT_SIZE;
                    // handle select box style
                    var selectBox = document.querySelector('div[data-item="selector"]') || null;
                    var selectBoxFound = selectBox ? true : false;
                    selectBox = selectBox || document.createElement('div');
                    var selectBoxStyle = "\n\t\t\t\t\t\t\twidth: " + boxWidth + "px;\n\t\t\t\t\t\t\theight: " + boxHeight + "px;\n\t\t\t\t\t\t\tborder: 1px solid #0a84ff;\n\t\t\t\t\t\t\tbackground-color: transparent;\n\t\t\t\t\t\t\tbox-sizing: border-box;\n\t\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\t\tz-index: 10;\n\t\t\t\t\t\t\tleft: " + boxX + "px;\n\t\t\t\t\t\t\ttop: " + boxY + "px;\n\t\t\t\t\t\t";
                    selectBox.setAttribute('style', selectBoxStyle);
                    // init select box if not found
                    if (!selectBoxFound) {
                        selectBox.setAttribute('data-item', 'selector');
                        selectBox.addEventListener('mousedown', handleElementMousedown);
                    }
                    document.body.appendChild(selectBox);
                }
                break;
            case "line":
                {
                    var relPositionsLine = {
                        x1: parseInt(currentElement.getAttribute("x1")),
                        y1: parseInt(currentElement.getAttribute("y1")),
                        x2: parseInt(currentElement.getAttribute("x2")),
                        y2: parseInt(currentElement.getAttribute("y2"))
                    };
                    var svgCoords = svg.getBoundingClientRect();
                    var absPositionsLine = {
                        x1: parseInt(currentElement.getAttribute("x1")) + svgCoords.x,
                        y1: parseInt(currentElement.getAttribute("y1")) + svgCoords.y,
                        x2: parseInt(currentElement.getAttribute("x2")) + svgCoords.x,
                        y2: parseInt(currentElement.getAttribute("y2")) + svgCoords.y
                    };
                    var lineMinX = Math.min(absPositionsLine.x1, absPositionsLine.x2);
                    var lineMinY = Math.min(absPositionsLine.y1, absPositionsLine.y2);
                    // Set box dimensions
                    padding = 0;
                    var boxX = lineMinX - padding / 2;
                    var boxY = lineMinY - padding / 2;
                    var boxWidth = dimensions.width + padding;
                    var boxHeight = dimensions.height + padding;
                    // handle select box style
                    var selectBox_1 = document.querySelector('div[data-item="selector"]') || null;
                    var selectBoxFound = selectBox_1 ? true : false;
                    selectBox_1 = selectBox_1 || document.createElement('div');
                    var newSelectBoxStyle = "\n\t\t\t\t\t\t\twidth: " + boxWidth + "px;\n\t\t\t\t\t\t\theight: " + boxHeight + "px;\n\t\t\t\t\t\t\t//border: 1px solid #0a84ff;\n\t\t\t\t\t\t\tbackground-color: transparent;\n\t\t\t\t\t\t\tbox-sizing: border-box;\n\t\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\t\tz-index: 10;\n\t\t\t\t\t\t\tleft: " + boxX + "px;\n\t\t\t\t\t\t\ttop: " + boxY + "px;\n\t\t\t\t\t\t";
                    selectBox_1.setAttribute('style', newSelectBoxStyle);
                    // resize square dims
                    var resizeLength_1 = RESIZE_RECTANGLE_LENGTH;
                    // NOTE(fede): positioned relative to the selection rectangle
                    var resizeDims_1 = {
                        point1: {
                            x: absPositionsLine.x1 - boxX - resizeLength_1 / 2,
                            y: absPositionsLine.y1 - boxY - resizeLength_1 / 2
                        },
                        point2: {
                            x: absPositionsLine.x2 - boxX - resizeLength_1 / 2,
                            y: absPositionsLine.y2 - boxY - resizeLength_1 / 2
                        }
                    };
                    var rectangleSelectors = ['point1', 'point2'].map(function (location) {
                        var item = document.querySelector("div[data-location=\"" + location + "\"]") || createResizeSquare(location);
                        var cursor;
                        if (isResizingPoint1 || isResizingPoint2) {
                            cursor = 'grabbing';
                        }
                        else {
                            cursor = 'grab';
                        }
                        var newItemStyle = "\n\t\t\t\t\t\t\t\t\twidth: " + resizeLength_1 + "px;\n\t\t\t\t\t\t\t\t\theight: " + resizeLength_1 + "px;\n\t\t\t\t\t\t\t\t\tborder: 1px solid #000;\n\t\t\t\t\t\t\t\t\tbackground-color: #fff;\n\t\t\t\t\t\t\t\t\tbox-sizing: border-box;\n\t\t\t\t\t\t\t\t\tcursor: " + cursor + ";\n\t\t\t\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\t\t\t\tz-index: 20;\n\t\t\t\t\t\t\t\t\tleft: " + resizeDims_1[location].x + "px;\n\t\t\t\t\t\t\t\t\ttop: " + resizeDims_1[location].y + "px;\n\t\t\t\t\t\t\t\t";
                        item.setAttribute('style', newItemStyle);
                        return item;
                    });
                    // init select box if not found
                    if (!selectBoxFound) {
                        selectBox_1.setAttribute('data-item', 'selector');
                        selectBox_1.addEventListener('mousedown', handleElementMousedown);
                        rectangleSelectors.forEach(function (rect) {
                            selectBox_1.appendChild(rect);
                        });
                    }
                    document.body.appendChild(selectBox_1);
                }
                break;
            case "rect":
                {
                    // Set box dimensions
                    var boxX = intCoords.x - padding / 2;
                    var boxY = intCoords.y - padding / 2;
                    var boxWidth = dimensions.width + padding;
                    var boxHeight = dimensions.height + padding;
                    // resize square dims
                    var resizeLength_2 = RESIZE_RECTANGLE_LENGTH;
                    var resizeDims_2 = {
                        up: {
                            x: boxWidth / 2 - resizeLength_2 / 2,
                            y: -resizeLength_2 / 2
                        },
                        down: {
                            x: boxWidth / 2 - resizeLength_2 / 2,
                            y: boxHeight - resizeLength_2 / 2
                        },
                        left: {
                            x: -resizeLength_2 / 2,
                            y: boxHeight / 2 - resizeLength_2 / 2
                        },
                        right: {
                            x: boxWidth - resizeLength_2 / 2,
                            y: boxHeight / 2 - resizeLength_2 / 2
                        }
                    };
                    // handle select box style
                    var selectBox_2 = document.querySelector('div[data-item="selector"]') || null;
                    var selectBoxFound = selectBox_2 ? true : false;
                    selectBox_2 = selectBox_2 || document.createElement('div');
                    var newSelectBoxStyle = "\n\t\t\t\t\t\t\twidth: " + boxWidth + "px;\n\t\t\t\t\t\t\theight: " + boxHeight + "px;\n\t\t\t\t\t\t\tborder: 1px solid #0a84ff;\n\t\t\t\t\t\t\tbackground-color: transparent;\n\t\t\t\t\t\t\tbox-sizing: border-box;\n\t\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\t\tz-index: 10;\n\t\t\t\t\t\t\tleft: " + boxX + "px;\n\t\t\t\t\t\t\ttop: " + boxY + "px;\n\t\t\t\t\t\t";
                    selectBox_2.setAttribute('style', newSelectBoxStyle);
                    // handle resize rectangle style (Store in Array in case I need to insert them)
                    var rectangleSelectors = ['up', 'down', 'left', 'right'].map(function (location) {
                        var item = (document.querySelector("div[data-location=\"" + location + "\"]") || createResizeSquare(location));
                        var cursor = arrayIncludes(['up', 'down'], location) ? 'ns-resize' : 'ew-resize';
                        var itemStyle = "\n\t\t\t\t\t\t\t\twidth: " + resizeLength_2 + "px;\n\t\t\t\t\t\t\t\theight: " + resizeLength_2 + "px;\n\t\t\t\t\t\t\t\tborder: 1px solid #000;\n\t\t\t\t\t\t\t\tbackground-color: #fff;\n\t\t\t\t\t\t\t\tbox-sizing: border-box;\n\t\t\t\t\t\t\t\tcursor: " + cursor + ";\n\t\t\t\t\t\t\t\tposition: absolute;\n\t\t\t\t\t\t\t\tz-index: 20;\n\t\t\t\t\t\t\t\tleft: " + resizeDims_2[location].x + "px;\n\t\t\t\t\t\t\t\ttop: " + resizeDims_2[location].y + "px;\n\t\t\t\t\t\t\t";
                        item.setAttribute('style', itemStyle);
                        return item;
                    });
                    // init select box if not found
                    if (!selectBoxFound) {
                        selectBox_2.setAttribute('data-item', 'selector');
                        selectBox_2.addEventListener('mousedown', handleElementMousedown);
                        rectangleSelectors.forEach(function (rect) {
                            selectBox_2.appendChild(rect);
                        });
                    }
                    document.body.appendChild(selectBox_2);
                }
                break;
            default: {
            }
        }
    }
    else {
        // Delete select box if found
        removeSelectBox();
    }
}
// Create elements
function createResizeSquare(location) {
    var square = document.createElement('div');
    square.setAttribute('data-item', "resize");
    square.setAttribute('data-location', "" + location);
    return square;
}
/*
 * DOWNLOAD
 */
function download() {
    var element = document.createElement('a');
    var str = new XMLSerializer().serializeToString(svg);
    var blob = new Blob([str], { type: 'image/svg+xml' });
    var objectURL = URL.createObjectURL(blob);
    element.setAttribute('href', objectURL);
    element.setAttribute('download', 'svg-draw.svg');
    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
}
/*
 * HELPERS
 */
function getRelativeCoords(element) {
    var x;
    var y;
    var width;
    var height;
    switch (element.localName) {
        case 'rect':
            x = parseInt(element.getAttribute('x'));
            y = parseInt(element.getAttribute('y'));
            width = parseInt(element.getAttribute('width'));
            height = parseInt(element.getAttribute('height'));
            break;
        case 'text':
            var textClientBoundRect = element.getBoundingClientRect();
            x = parseInt(element.getAttribute('x'));
            y = parseInt(element.getAttribute('y'));
            width = textClientBoundRect.width;
            height = textClientBoundRect.height;
            break;
        case 'line':
            var lineClientBoundRect = element.getBoundingClientRect();
            x = parseInt(element.getAttribute('x1'));
            y = parseInt(element.getAttribute('y1'));
            width = lineClientBoundRect.width;
            height = lineClientBoundRect.height;
            break;
    }
    return {
        x: x,
        y: y,
        width: width,
        height: height
    };
}
function getAbsoluteCoords(element) {
    var relCoords = getRelativeCoords(element);
    var svgCoords = svg.getBoundingClientRect();
    return {
        x: relCoords.x + svgCoords.x,
        y: relCoords.y + svgCoords.y,
        width: relCoords.width,
        height: relCoords.height
    };
}
function removeElement(element) {
    if (element) {
        element.parentNode.removeChild(element);
    }
}
function removeSelectBox() {
    var selectBox = document.querySelector('div[data-item="selector"]') || null;
    removeElement(selectBox);
}
function addKeyInput(currentText, newInput) {
    if (newInput == "Backspace") {
        return (currentText.length === 0 ? "" : currentText.slice(0, -1));
    }
    else {
        return (currentText + newInput);
    }
}
function capToBoundaries(val, min, max) {
    return Math.min(max, Math.max(val, min));
}
function arrayIncludes(array, val) {
    var i;
    var found = false;
    for (i = 0; i < array.length && !found; i++) {
        found = array[i] === val;
    }
    return found;
}
function elemGetAmount(element, attributeName) {
    return parseInt(element.getAttribute(attributeName));
}
// Debugging
function logElementPosition(element, label) {
    var dimensions = element.getBoundingClientRect();
    console.log(dimensions);
}
