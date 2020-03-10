/*
 * MAIN CANVAS AND DEFINITIONS
 */

let svg = document.querySelector('.js-svg');
let svgns = "http://www.w3.org/2000/svg";

let globalElements = {
	main: document.querySelector('main')
}

let NON_TEXT_KEYS = [
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
]
let DEFAULT_FONT_SIZE = 18;
let RESIZE_RECTANGLE_LENGTH = 10;
let DEFAULT_LINE_WIDTH = 5;

/*
 * CONTROLS
 */

let xSize = <HTMLInputElement>document.querySelector('.js-size-x');
let ySize = <HTMLInputElement>document.querySelector('.js-size-y');

/*
 * GLOBAL STATE
 */
// TODO(Fede): Everything should be moved into the global state object
let currentElement = null;
let movementInitCoords = null;
let globalState = {
	currentAction: null,
}

// movement
let isMovingElement = false;

// resize
let isResizingDown = false;
let isResizingUp = false;
let isResizingRight = false;
let isResizingLeft = false;
let isResizingPoint1 = false;
let isResizingPoint2 = false;

/*
 * EVENT LISTENERS FOR CONTROLS
 */

document.body.addEventListener('click', handleUserClick);
document.body.addEventListener('mousemove', handleUserMousemove);
document.body.addEventListener('mouseup', handleUserMouseup);
document.body.addEventListener('keydown', handleUserKeydown);

xSize.addEventListener('change', (e) => svg.setAttribute('width', xSize.value));
ySize.addEventListener('change', (e) => svg.setAttribute('height', ySize.value));


/*
 * EVENT HANDLER
 */

function handleUserKeydown(e) {
	if(currentElement !== null) {
		//TODO(Fede): maybe current Action can't be null and always has an action type?
		let actionType = globalState.currentAction ? globalState.currentAction.type : "none"
		switch(actionType) {
			case "initialInsert":
				if(globalState.currentAction.target.localName === "text") {
					if(!arrayIncludes(NON_TEXT_KEYS, e.key)) {
						e.preventDefault();
						currentElement.textContent = addKeyInput("", e.key);
						globalState.currentAction = {type: "inserting", target: currentElement};
						currentElement.setAttribute('fill', 'black');
						placeSelectBox();
					}
				} 
				break;
			case "inserting":
				if(globalState.currentAction.target.localName === "text") {
					if(!arrayIncludes(NON_TEXT_KEYS, e.key)) {
						e.preventDefault();
						let currentText = currentElement.textContent;
						let newText = addKeyInput(currentText, e.key);
						currentElement.textContent = newText;
						placeSelectBox();
					}
				}
				break;
			default:
				// Delete current element
				if((e.keyCode === 8 || e.keyCode === 46)) {
					e.preventDefault();
					removeElement(currentElement);
					currentElement = null;
					placeSelectBox();
				}
		}
	}
}

function handleUserClick(e) {
	let itemType = e.target.getAttribute('data-item') || null;

	if(itemType) {
		e.preventDefault();
	}

  if(itemType == 'download') {
    download();
  }


	if(globalState.currentAction) {
		// Handle current action
		let actionType = globalState.currentAction.type;

		switch(actionType) {
			case "beforeInsert": {
				let object = globalState.currentAction.object;
				switch(object) {
					case "line": {
						let svgCoords = svg.getBoundingClientRect();
						let relativeX = e.clientX - svgCoords.x;
						let relativeY = e.clientY - svgCoords.y
						let maxX = svgCoords.width;
						let maxY = svgCoords.height;
						let minX = 0;
						let minY = 0;

						let isInsideSvg = relativeX >= minX && relativeX <= maxX && relativeX >= minY && relativeY <= maxY
						if(isInsideSvg) {
							let line = document.createElementNS(svgns, 'line');
							line.setAttribute('x1', relativeX.toString());
							line.setAttribute('y1', relativeY.toString());
							line.setAttribute('x2', relativeX.toString());
							line.setAttribute('y2', relativeY.toString());
							line.setAttribute('stroke', 'black');
							line.setAttribute('stroke-width', DEFAULT_LINE_WIDTH.toString());
							line.setAttribute('data-item', 'element');

							globalState.currentAction = {type: "inserting", target: line};
							svg.appendChild(line);
						}
					} break;

					case "rect": {
						let svgCoords = svg.getBoundingClientRect();
						let relativeX = e.clientX - svgCoords.x;
						let relativeY = e.clientY - svgCoords.y
						let maxX = svgCoords.width;
						let maxY = svgCoords.height;
						let minX = 0;
						let minY = 0;

						let isInsideSvg = relativeX >= minX && relativeX <= maxX && relativeX >= minY && relativeY <= maxY
						if(isInsideSvg) {
							let rect = document.createElementNS(svgns, 'rect');
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
                initialCoords: { x: relativeX, y: relativeY },
              };

							svg.appendChild(rect);
						}
					} break;

					case "text": {
						let svgCoords = svg.getBoundingClientRect();
						let relativeX = e.clientX - svgCoords.x;
						let relativeY = e.clientY - svgCoords.y + DEFAULT_FONT_SIZE;
						let maxX = svgCoords.width;
						let maxY = svgCoords.height;
						let minX = 0;
						let minY = DEFAULT_FONT_SIZE;

						if(relativeX >= minX && relativeX <= maxX && relativeX >= minY && relativeY <= maxY) {	
							let text = document.createElementNS(svgns, 'text');
							text.setAttribute('x', relativeX.toString());
							text.setAttribute('y', relativeY.toString());
							text.setAttribute('fill', 'blue');
							text.setAttribute('data-item', 'element');
							text.setAttribute('style', `font-size: ${DEFAULT_FONT_SIZE}px`);
							text.textContent  = 'Enter text';

							currentElement = text;
							globalState.currentAction = {type: 'initialInsert', target: text};
							svg.appendChild(text);
							placeSelectBox();
						}
					} break;

				}
			} break;

			case 'inserting': {
				globalState.currentAction = null;
			} break;
		}
	} else {
		// Handle Element click
		switch(itemType) {
			case 'element':
				handleElementClick(e.target);
				break;

			case 'selector':
				break;

			case 'resize':
				break;

			case 'insert':
        currentElement = null;
				let element = e.target.getAttribute('data-element') || null
				if(element) {
					globalState.currentAction = {type: 'beforeInsert', object: element};
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
	if(globalState.currentAction && globalState.currentAction.type == "beforeInsert") {
		globalElements.main.className = 'main--before-insert';
	} else {
		globalElements.main.className = '';
	}
}

function handleUserMousemove(e) {
	if(currentElement) {
		e.preventDefault();
	}

	// TODO(fede): Wrap this in case statement to handle current action
	let currentActionType = globalState.currentAction ? globalState.currentAction.type : null;
	if(currentActionType === "inserting") {
    let target = globalState.currentAction.target
    let svgCoords = svg.getBoundingClientRect();
    let relativeX = e.clientX - svgCoords.x;
    let relativeY = e.clientY - svgCoords.y;

    switch(target.nodeName) {
      case "line": {
        let minX = 0;
        let maxX = parseInt(svg.getAttribute('width'));
        let minY = 0;
        let maxY = parseInt(svg.getAttribute('height'));

        let newX = capToBoundaries(relativeX, minX, maxX);
        let newY = capToBoundaries(relativeY, minY, maxY);

        let line = globalState.currentAction.target;

        line.setAttribute('x1', newX.toString());
        line.setAttribute('y1', newY.toString());
      } break;

      case "rect": {
        let minX = DEFAULT_LINE_WIDTH;
        let maxX = parseInt(svg.getAttribute('width')) - DEFAULT_LINE_WIDTH;
        let minY = DEFAULT_LINE_WIDTH;
        let maxY = parseInt(svg.getAttribute('height')) - DEFAULT_LINE_WIDTH;

        let initialCoords = globalState.currentAction.initialCoords;
        let x = initialCoords.x;
        let y = initialCoords.y;

        relativeX = capToBoundaries(relativeX, minX, maxX);
        relativeY = capToBoundaries(relativeY, minY, maxY);

        let newX = Math.min(x, relativeX);
        let newY = Math.min(y, relativeY);

        let widthVal = relativeX - x;
        let newWidth = widthVal > 0 ? widthVal : -widthVal; 
        let heightVal = relativeY - y;
        let newHeight = heightVal > 0 ? heightVal : -heightVal; 

        target.setAttribute('x', newX.toString());
        target.setAttribute('width', newWidth.toString());
        target.setAttribute('y', newY.toString());
        target.setAttribute('height', newHeight.toString());

      } break;
    }

	}

	// Move element
	if(currentElement && isMovingElement) {
		switch(currentElement.localName) {
			case "line": {
				movementInitCoords = movementInitCoords || {
					clientX: e.clientX, 
					clientY: e.clientY,
					elementX1: parseInt(currentElement.getAttribute('x1')),
					elementY1: parseInt(currentElement.getAttribute('y1')),
					elementX2: parseInt(currentElement.getAttribute('x2')),
					elementY2: parseInt(currentElement.getAttribute('y2')),
				};


				let mouseDiff = {
					x: e.clientX - movementInitCoords.clientX,
					y: e.clientY - movementInitCoords.clientY,
				};

				//NOTE(fede): this refers to the max value a point can have and not the actual x and
				// y values of the svg element as done with other elements

				let minX = 0;
				let maxX = parseInt(svg.getAttribute('width'));;
				let minY = 0;
				let maxY = parseInt(svg.getAttribute('height'));

				let minPointX = Math.min(movementInitCoords.elementX1, movementInitCoords.elementX2);
				let minPointY = Math.min(movementInitCoords.elementY1, movementInitCoords.elementY2);
				let maxPointX = Math.max(movementInitCoords.elementX1, movementInitCoords.elementX2);
				let maxPointY = Math.max(movementInitCoords.elementY1, movementInitCoords.elementY2);

				let maxDiffX = maxX - maxPointX;
				let minDiffX = minX - minPointX;
				let maxDiffY = maxY - maxPointY;
				let minDiffY = minY - minPointY;

				let movementDiff = {
					x: Math.min(maxDiffX, Math.max(minDiffX, mouseDiff.x)),
					y: Math.min(maxDiffY, Math.max(minDiffY, mouseDiff.y)),
				}

				let newPositions = {
					x1: movementInitCoords.elementX1 + movementDiff.x,
					y1: movementInitCoords.elementY1 + movementDiff.y,
					x2: movementInitCoords.elementX2 + movementDiff.x,
					y2: movementInitCoords.elementY2 + movementDiff.y,
				}


				// Set new position
				currentElement.setAttribute('x1', newPositions.x1);
				currentElement.setAttribute('y1', newPositions.y1);
				currentElement.setAttribute('x2', newPositions.x2);
				currentElement.setAttribute('y2', newPositions.y2);

				placeSelectBox();

			} break;

			case "text": {
				movementInitCoords = movementInitCoords || {
					clientX: e.clientX, 
					clientY: e.clientY,
					elementX: parseInt(currentElement.getAttribute('x')),
					elementY: parseInt(currentElement.getAttribute('y')),
				};


				let diff = {
					x: e.clientX - movementInitCoords.clientX,
					y: e.clientY - movementInitCoords.clientY,
				};

				let relativeCoords = getRelativeCoords(currentElement);

				// Get new x/y values
				let borderWidth = parseInt(currentElement.getAttribute('stroke-width') || 0);
				let minX = 0 + borderWidth;
				let maxX = parseInt(svg.getAttribute('width')) - borderWidth - relativeCoords.width;
				let minY = 0 + borderWidth + DEFAULT_FONT_SIZE;
				let maxY = parseInt(svg.getAttribute('height')) - relativeCoords.height - borderWidth + DEFAULT_FONT_SIZE;

				let targetX = movementInitCoords.elementX + diff.x;
				let newX = Math.min(maxX, Math.max(minX, targetX));
				let targetY = movementInitCoords.elementY + diff.y;
				let newY = Math.min(maxY, Math.max(minY, targetY));

				// Set new position
				currentElement.setAttribute('x', newX);
				currentElement.setAttribute('y', newY);

				placeSelectBox();
			} break;

			default: {
				movementInitCoords = movementInitCoords || {
					clientX: e.clientX, 
					clientY: e.clientY,
					elementX: parseInt(currentElement.getAttribute('x')),
					elementY: parseInt(currentElement.getAttribute('y')),
				};


				let diff = {
					x: e.clientX - movementInitCoords.clientX,
					y: e.clientY - movementInitCoords.clientY,
				};

				let relativeCoords = getRelativeCoords(currentElement);

				// Get new x/y values
				let borderWidth = parseInt(currentElement.getAttribute('stroke-width') || 0);
        let minX = 0 + borderWidth / 2;
        let maxX = parseInt(svg.getAttribute('width')) - borderWidth / 2 - relativeCoords.width;
        let minY = 0 + borderWidth / 2;// + borderWidth;
        let maxY = parseInt(svg.getAttribute('height')) - relativeCoords.height - borderWidth / 2;

				let targetX = movementInitCoords.elementX + diff.x;
				let newX = Math.min(maxX, Math.max(minX, targetX));
				let targetY = movementInitCoords.elementY + diff.y;
				let newY = Math.min(maxY, Math.max(minY, targetY));

				// Set new position
				currentElement.setAttribute('x', newX);
				currentElement.setAttribute('y', newY);

				placeSelectBox();
			}
		}
	}

	// Resize Vertically
	if(currentElement && isResizingUp) {
		movementInitCoords = movementInitCoords || {
			clientY: e.clientY,
			elementY: parseInt(currentElement.getAttribute('y')),
			elementHeight: parseInt(currentElement.getAttribute('height')),
		};

		let diff = {
			y: movementInitCoords.clientY - e.clientY,
		};

		// Set new height value
		let borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
		let targetHeight = movementInitCoords.elementHeight + diff.y;
		let maxHeight;
		let minHeight = 1;
		let newHeight;

		if(targetHeight >= 0) {
			// upwards resize (move y up and make larger)
			let targetY = movementInitCoords.elementY - diff.y
			if(targetY >= 0) {
				currentElement.setAttribute('y', targetY);
				currentElement.setAttribute('height', targetHeight);
			}
		} else {
			// downwards resize (make element larger keeping y)
			maxHeight = parseInt(svg.getAttribute('height')) - parseInt(currentElement.getAttribute('y')) - borderWidth;
			newHeight = Math.min(maxHeight, Math.max(minHeight, -targetHeight));
			currentElement.setAttribute('height', newHeight);
		}
		placeSelectBox();
	}

	if(currentElement && isResizingDown) {
		movementInitCoords = movementInitCoords || {
			clientY: e.clientY,
			elementY: parseInt(currentElement.getAttribute('y')),
			elementHeight: parseInt(currentElement.getAttribute('height')),
		};

		let diff = {
			y: e.clientY - movementInitCoords.clientY,
		};

		// Set new height value
		let borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
		let targetHeight = movementInitCoords.elementHeight + diff.y;
		let maxHeight;
		let minHeight = 1;
		let newHeight;

		if(targetHeight >= 0) {
			// downwards resize (make element larger keeping y)
			maxHeight = parseInt(svg.getAttribute('height')) - parseInt(currentElement.getAttribute('y')) - borderWidth;
			newHeight = Math.min(maxHeight, Math.max(minHeight, targetHeight));
			currentElement.setAttribute('height', newHeight);
		} else {
			// upwards resize (move y up and make larger)
			let targetY = movementInitCoords.elementY + targetHeight
			if(targetY >= 0) {
				currentElement.setAttribute('y', targetY);
				currentElement.setAttribute('height', -targetHeight);
			}
		}

		placeSelectBox();
	}

	if(currentElement && isResizingRight) {
		movementInitCoords = movementInitCoords || {
			clientX: e.clientX,
			elementX: parseInt(currentElement.getAttribute('x')),
			elementWidth: parseInt(currentElement.getAttribute('width')),
		};

		let diff = {
			x: e.clientX - movementInitCoords.clientX,
		};

		// Set new width value
		let borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
		let targetWidth = movementInitCoords.elementWidth + diff.x;
		let maxWidth;
		let minWidth = 1;
		let newWidth;

		if(targetWidth >= 0) {
			// right resize (make element larger keeping x)
			maxWidth = parseInt(svg.getAttribute('width')) - parseInt(currentElement.getAttribute('x')) - borderWidth;
			newWidth = Math.min(maxWidth, Math.max(minWidth, targetWidth));
			currentElement.setAttribute('width', newWidth);
		} else {
			// left resize (move x left and make larger)
			let targetX = movementInitCoords.elementX + targetWidth
			// Ignore transform if implies going outside the canvass
			if(targetX >= 0) {
				currentElement.setAttribute('x', targetX);
				currentElement.setAttribute('width', -targetWidth);
			}
		}

		placeSelectBox();
	}

	if(currentElement && isResizingLeft) {
		movementInitCoords = movementInitCoords || {
			clientX: e.clientX,
			elementX: parseInt(currentElement.getAttribute('x')),
			elementWidth: parseInt(currentElement.getAttribute('width')),
		};

		let diff = {
			x: movementInitCoords.clientX - e.clientX,
		};

		// Set new width value
		let borderWidth = parseInt(currentElement.getAttribute('stroke-width'));
		let targetWidth = movementInitCoords.elementWidth + diff.x;
		let maxWidth;
		let minWidth = 1;
		let newWidth;

		if(targetWidth >= 0) {
			// left resize (move x left and make larger)
			let targetX = movementInitCoords.elementX - diff.x;
			// Ignore transform if implies going outside the canvass
			if(targetX >= 0) {
				currentElement.setAttribute('x', targetX);
				currentElement.setAttribute('width', Math.max(targetWidth, minWidth));
			}
		} else {
			// right resize (make element larger keeping x)
			maxWidth = parseInt(svg.getAttribute('width')) - parseInt(currentElement.getAttribute('x')) - borderWidth;
			newWidth = Math.min(maxWidth, Math.max(minWidth, -targetWidth));
			currentElement.setAttribute('width', newWidth);
		}

		placeSelectBox();
	}

	// Resize Line by Points
	if(currentElement && isResizingPoint1) {
		let svgCoords = svg.getBoundingClientRect();
		let relativeX = e.clientX - svgCoords.x;
		let relativeY = e.clientY - svgCoords.y

		let minX = 0;
		let maxX = parseInt(svg.getAttribute('width'));;
		let minY = 0;
		let maxY = parseInt(svg.getAttribute('height'));

		let newX = capToBoundaries(relativeX, minX, maxX);
		let newY = capToBoundaries(relativeY, minY, maxY);

		let line = currentElement;

		line.setAttribute('x1', newX.toString());
		line.setAttribute('y1', newY.toString());
		placeSelectBox();
	}
	if(currentElement && isResizingPoint2) {
		let svgCoords = svg.getBoundingClientRect();
		let relativeX = e.clientX - svgCoords.x;
		let relativeY = e.clientY - svgCoords.y

		let minX = 0;
		let maxX = parseInt(svg.getAttribute('width'));;
		let minY = 0;
		let maxY = parseInt(svg.getAttribute('height'));

		let newX = capToBoundaries(relativeX, minX, maxX);
		let newY = capToBoundaries(relativeY, minY, maxY);

		let line = currentElement;

		line.setAttribute('x2', newX.toString());
		line.setAttribute('y2', newY.toString());
		placeSelectBox();
	}
}

function handleElementClick(element) {
	selectElement(element);
}

function handleElementMousedown(e) {
	let itemType = e.target.getAttribute('data-item') || null;

	if(itemType === 'selector') {
		isMovingElement = true;
	}

	if(itemType === 'resize') {
		let resizeDirection = e.target.getAttribute('data-location') || null;
		if(resizeDirection === "down") {
			isResizingDown = true;
		}

		if(resizeDirection === "up") {
			isResizingUp = true;
		}

		if(resizeDirection === "right") {
			isResizingRight = true;
		}

		if(resizeDirection === "left") {
			isResizingLeft = true;
		}
		if(resizeDirection === "point1") {
			isResizingPoint1 = true;
		}
		if(resizeDirection === "point2") {
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
	if(currentElement) {
		let padding = 5;
		let dimensions = currentElement.getBoundingClientRect();
		let intCoords = getAbsoluteCoords(currentElement);

		switch(currentElement.localName) {
			case "text": {
				// Set box dimensions
				let boxX = intCoords.x - padding / 2;
				let boxY = intCoords.y - DEFAULT_FONT_SIZE;
				let boxWidth = dimensions.width + padding;
				let boxHeight = padding + DEFAULT_FONT_SIZE;

				// handle select box style
				let selectBox = document.querySelector('div[data-item="selector"]') || null;
				let selectBoxFound = selectBox ? true : false;
				selectBox = selectBox || document.createElement('div');
				let selectBoxStyle = `
							width: ${boxWidth}px;
							height: ${boxHeight}px;
							border: 1px solid #0a84ff;
							background-color: transparent;
							box-sizing: border-box;
							position: absolute;
							z-index: 10;
							left: ${boxX}px;
							top: ${boxY}px;
						`

				selectBox.setAttribute('style', selectBoxStyle);

				// init select box if not found
				if(!selectBoxFound) {
					selectBox.setAttribute('data-item', 'selector');
					selectBox.addEventListener('mousedown', handleElementMousedown);
				}

				document.body.appendChild(selectBox);

			}	break;

			case "line": {
				let relPositionsLine = {
					x1: parseInt(currentElement.getAttribute("x1")),
					y1: parseInt(currentElement.getAttribute("y1")),
					x2: parseInt(currentElement.getAttribute("x2")),
					y2: parseInt(currentElement.getAttribute("y2")),
				}
				let svgCoords = svg.getBoundingClientRect();
				let absPositionsLine = {
					x1: parseInt(currentElement.getAttribute("x1")) + svgCoords.x,
					y1: parseInt(currentElement.getAttribute("y1")) + svgCoords.y,
					x2: parseInt(currentElement.getAttribute("x2")) + svgCoords.x,
					y2: parseInt(currentElement.getAttribute("y2")) + svgCoords.y,
				}

				let lineMinX = Math.min(absPositionsLine.x1, absPositionsLine.x2)
				let lineMinY = Math.min(absPositionsLine.y1, absPositionsLine.y2)

				// Set box dimensions
				padding = 0;
				let boxX = lineMinX - padding / 2;
				let boxY = lineMinY - padding / 2;
				let boxWidth = dimensions.width + padding;
				let boxHeight = dimensions.height + padding;

				// handle select box style
				let selectBox = document.querySelector('div[data-item="selector"]') || null;
				let selectBoxFound = selectBox ? true : false;
				selectBox = selectBox || document.createElement('div');

				let newSelectBoxStyle = `
							width: ${boxWidth}px;
							height: ${boxHeight}px;
							//border: 1px solid #0a84ff;
							background-color: transparent;
							box-sizing: border-box;
							position: absolute;
							z-index: 10;
							left: ${boxX}px;
							top: ${boxY}px;
						`
				selectBox.setAttribute('style', newSelectBoxStyle);

				// resize square dims
				let resizeLength = RESIZE_RECTANGLE_LENGTH;
				// NOTE(fede): positioned relative to the selection rectangle
				let resizeDims = {
					point1: {
						x: absPositionsLine.x1 - boxX - resizeLength / 2,
						y: absPositionsLine.y1 - boxY - resizeLength / 2,
					},
					point2: {
						x: absPositionsLine.x2 - boxX - resizeLength / 2,
						y: absPositionsLine.y2 - boxY - resizeLength / 2,
					},
				}

				let rectangleSelectors =
					['point1', 'point2'].map(function(location) {
						let item = document.querySelector(`div[data-location="${location}"]`) || createResizeSquare(location);

						let cursor;
						if(isResizingPoint1 || isResizingPoint2) {
							cursor = 'grabbing';
						}	else {
							cursor = 'grab';
						}


						let newItemStyle = `
									width: ${resizeLength}px;
									height: ${resizeLength}px;
									border: 1px solid #000;
									background-color: #fff;
									box-sizing: border-box;
									cursor: ${cursor};
									position: absolute;
									z-index: 20;
									left: ${resizeDims[location].x}px;
									top: ${resizeDims[location].y}px;
								`
						item.setAttribute('style', newItemStyle);

						return item
					})

				// init select box if not found
				if(!selectBoxFound) {
					selectBox.setAttribute('data-item', 'selector');
					selectBox.addEventListener('mousedown', handleElementMousedown);

					rectangleSelectors.forEach(function(rect) {
						selectBox.appendChild(rect);
					})
				}

				document.body.appendChild(selectBox);

			}	break;

			case "rect": {
				// Set box dimensions
				let boxX = intCoords.x - padding / 2 - DEFAULT_LINE_WIDTH;
				let boxY = intCoords.y - padding / 2 - DEFAULT_LINE_WIDTH;
				let boxWidth = dimensions.width + padding + DEFAULT_LINE_WIDTH;
				let boxHeight = dimensions.height + padding + DEFAULT_LINE_WIDTH;

				// resize square dims
				let resizeLength = RESIZE_RECTANGLE_LENGTH;
				let resizeDims = {
					up: {
						x: boxWidth / 2 - resizeLength / 2,
						y: - resizeLength / 2,
					},
					down: {
						x: boxWidth / 2 - resizeLength / 2,
						y: boxHeight - resizeLength / 2,
					},
					left: {
						x: -resizeLength / 2,
						y: boxHeight / 2 - resizeLength / 2,
					},
					right: {
						x: boxWidth - resizeLength / 2,
						y: boxHeight / 2 - resizeLength / 2,
					},
				}

				// handle select box style
				let selectBox = document.querySelector('div[data-item="selector"]') || null;
				let selectBoxFound = selectBox ? true : false;
				selectBox = selectBox || document.createElement('div');
				let newSelectBoxStyle = `
							width: ${boxWidth}px;
							height: ${boxHeight}px;
							border: 1px solid #0a84ff;
							background-color: transparent;
							box-sizing: border-box;
							position: absolute;
							z-index: 10;
							left: ${boxX}px;
							top: ${boxY}px;
						`
				selectBox.setAttribute('style', newSelectBoxStyle);

				// handle resize rectangle style (Store in Array in case I need to insert them)
				let rectangleSelectors =
					['up', 'down', 'left', 'right'].map(function(location) {
						let item = <HTMLElement>(document.querySelector(`div[data-location="${location}"]`) || createResizeSquare(location));
						let cursor = arrayIncludes(['up', 'down'], location) ? 'ns-resize' : 'ew-resize';

						let itemStyle = `
								width: ${resizeLength}px;
								height: ${resizeLength}px;
								border: 1px solid #000;
								background-color: #fff;
								box-sizing: border-box;
								cursor: ${cursor};
								position: absolute;
								z-index: 20;
								left: ${resizeDims[location].x}px;
								top: ${resizeDims[location].y}px;
							`

						item.setAttribute('style', itemStyle);

						return item
					})

				// init select box if not found
				if(!selectBoxFound) {
					selectBox.setAttribute('data-item', 'selector');
					selectBox.addEventListener('mousedown', handleElementMousedown);

					rectangleSelectors.forEach(function(rect) {
						selectBox.appendChild(rect);
					})
				}

				document.body.appendChild(selectBox);
			} break;

			default: {
			}
		}


	} else {
		// Delete select box if found
		removeSelectBox()
	}
}

// Create elements
function createResizeSquare(location) {
	let square = document.createElement('div');
	square.setAttribute('data-item', `resize`);
	square.setAttribute('data-location', `${location}`);

	return square;
}

/*
 * DOWNLOAD
 */

function download() {
	let element = document.createElement('a');
	let str = new XMLSerializer().serializeToString(svg);
	let blob = new Blob([str], {type: 'image/svg+xml'});
	let objectURL = URL.createObjectURL(blob);
	
	element.setAttribute('href', objectURL)
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
	let x
	let y
	let width
	let height

	switch(element.localName) {
		case 'rect':
			x = parseInt(element.getAttribute('x'));
			y = parseInt(element.getAttribute('y'));
			width = parseInt(element.getAttribute('width'));
			height = parseInt(element.getAttribute('height'));
			break;

		case 'text':
			let textClientBoundRect = element.getBoundingClientRect();
			x = parseInt(element.getAttribute('x'));
			y = parseInt(element.getAttribute('y'));
			width = textClientBoundRect.width;
			height = textClientBoundRect.height;
			break;

		case 'line':
			let lineClientBoundRect = element.getBoundingClientRect();
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
		height: height,
	}
}

function getAbsoluteCoords(element) {
	let relCoords = getRelativeCoords(element);
	let svgCoords = svg.getBoundingClientRect();


	return {
		x: relCoords.x + svgCoords.x,
		y: relCoords.y + svgCoords.y,
		width: relCoords.width,
		height: relCoords.height,
	}
}

function removeElement(element) {
	if(element) {
		element.parentNode.removeChild(element);
	}
}

function removeSelectBox() {
	let selectBox = document.querySelector('div[data-item="selector"]') || null;
	removeElement(selectBox);
}

function addKeyInput(currentText, newInput) {
	if(newInput == "Backspace") {
		return(currentText.length === 0 ? "" : currentText.slice(0, -1))
	} else {
		return(currentText + newInput)
	}
}

function capToBoundaries(val, min, max) {
	return Math.min(max, Math.max(val, min));
}

function arrayIncludes(array: any[], val): boolean {
	let i;
	let found = false;
	for(i = 0; i < array.length && !found; i++) {
		found = array[i] === val;
	}

	return found;
}

function elemGetAmount(element: Element, attributeName: string): number {
  return parseInt(element.getAttribute(attributeName));
}

// Debugging

function logElementPosition(element, label) {
	let dimensions = element.getBoundingClientRect();
	console.log(dimensions);
}
