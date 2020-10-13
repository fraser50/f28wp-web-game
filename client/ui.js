/*
	Everything to to with the UI should be in this file

	Some general stuff about UI objects:
	  • The id parameter is not strictly necessary, but help when looking at the html code in a browser
	  • The align parameter must be one of:
	      - "tl" - Top left
	      - "bl" - Bottom left
	      - "tr" - Top right
	      - "br" - Bottom right
	  • The create() function is to set things specific to that type of element; it should always be overridden
*/

class UiElement {
	constructor(elemType, id, x, y, align) {
		if (new.target === UiElement) throw TypeError("Cannot instantiate UiElement class");

		this.elemType = elemType;
		this.id = id;
		this.x = x;
		this.y = y;
		this.align = align;
	}

	create() {
		throw "UI element tried to run unimplemented create function";
	}
}


class UiWindow {
	constructor(id, x, y, align, w, h) {
		if (id == undefined || id == null) throw "Tried to make UI window with invalid ID";
		this.id = id;

		this.x = x;
		this.y = y;
		this.align = align;
		this.w = w;
		this.h = h;

		this.objects = [];
	}

	addObject(object) {
		this.objects.push(object);

		//if (object.class == undefined || object.class == null) throw `Tried to render UI element with invalid class "${object.class}"`;

		var objElem = document.createElement(object.elemType);
		//objElem.className = object.class;
		objElem.id = object.id;

		object.elem = objElem;

		// Set the position of the element, using the alignment
		if (object.align.substr(1) == "l") // If aligned to left
			objElem.style.left = object.x + "px";
		else // Assume not "l" means align to right
			objElem.style.left = `calc(100% - ${object.x}px - ${object.w}px)`;

		if (object.align.substr(0, 1) == "t") // If aligned to top
			objElem.style.top = object.y + "px";
		else // Assume not "t" means align to bottom
			objElem.style.top = `calc(100% - ${object.y}px - ${object.h}px)`;

		object.create();
	}

	addToPage() {
		// Remove the window from the page if it already exists
		if (ui.querySelector("#"+this.id) != undefined)
			ui.removeChild(ui.querySelector("#"+this.id))

		var win = document.createElement("div");
		win.className = "uiWindow";
		win.id = this.id;

		// Set the size of the window
		win.style.width = this.w + "px";
		win.style.height = this.h + "px";

		// Set the position of the window, using the alignment
		if (this.align.substr(1) == "l") // If aligned to left
			win.style.left = this.x + "px";
		else // Assume not "l" means align to right
			win.style.left = `calc(100% - ${this.x}px - ${this.w}px)`;

		if (this.align.substr(0, 1) == "t") // If aligned to top
			win.style.top = this.y + "px";
		else // Assume not "t" means align to bottom
			win.style.top = `calc(100% - ${this.y}px - ${this.h}px)`;

		// 
		for (var i=0; i<this.objects.length; i++) {
			var o = this.objects[i];
			if (o.elem == undefined) continue;
			win.appendChild(o.elem);
		}

		ui.appendChild(win);

		this.win = win;
	}
}

class UiLabel extends UiElement {
	constructor(id, x, y, align, text, font) {
		super("span", id, x, y, align);

		this.text = text;
		this.font = font;
	}

	updateValue(newValue) {
		this.text = newValue.toString();

		if (this.elem == undefined) return; // If the label has not been created as an HTML object then return now to avoid errors
		this.elem.innerText = newValue.toString();
	}

	create() {
		this.elem.style.font = this.font;
		this.elem.innerText = this.text.toString();
	}
}
