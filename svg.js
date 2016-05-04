/*
  A simple wrapper for SVG primative interface.
*/

S = {
    xmlns: 'http://www.w3.org/2000/svg',
    append: function (parent, child) {
	parent.appendChild(child);
    },
    create: function (tag, descr) {
	var elem = document.createElementNS(this.xmlns, tag);
	if (descr != undefined) {
	    this.attr(elem, descr);
	}
	return elem;
    },
    attr: function (elem, descr) {
	for (var attr in descr) {
	    var val = descr[attr];
	    elem.setAttributeNS(null, attr, val);
	}
	return elem;
    },
    text: function (elem, text) {
	var tnode = document.createTextNode(text);
	elem.appendChild(tnode);
	return elem;
    },
    title: function (elem, text) {
	// remove existing title
	var telem = this.create('title');
	this.text(telem, text);
	var child = elem.firstElementChild;;
	while (child) {
	    if (child.tagName == 'title') {
		elem.removeChild(child);
		child = elem.firstElementChild;
	    }
	}
	elem.appendChild(telem);
	return telem;
    },
    g: function () {
	var g = this.create('g');
	for (var i = 0; i < arguments.length; i++) {
	    this.append(elem, arguments[i]);
	}
	return elem;
    },
    line: function (x1, y1, x2, y2) {
	var l = this.create('line', {
	    'x1': x1,
	    'y1': y1,
	    'x2': x2,
	    'y2': y2
	})
	return l;
    },
    circle: function (cx, cy, r) {
	var c = this.create('circle', {
	    'cx': cx,
	    'cy': cy,
	    'r': r
	})
	return c;
    }
}
