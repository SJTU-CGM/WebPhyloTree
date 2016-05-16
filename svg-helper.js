"use strict";

var SvgHelper = (function(){
    function slice(arr, begin, end) {
	return Array.from(arr).slice(begin, end);
    }
    function apply(func, arr) {
	return func.apply(null, arr);
    }
    var SH = {
	xmlns: 'http://www.w3.org/2000/svg',
	error: function (func, msg, _others) {
	    var str = SH.format("SvgHelper: % '%'", func, msg);
	    for (var s of slice(arguments, 2)) {
		str += s;
	    }
	    return str;
	},
	transform: function (elem, txt) {
	    SH.attr(elem, { "transform": txt });
	},
	format: function (pattern) {
	    var str = "";
	    var i, j;
	    for (i = j = 0; i < pattern.length; i++) {
		if (pattern[i] == '%') {
		    j += 1;
		    if (arguments[j] == undefined || isNaN(arguments[j])) {
			debugger;
		    }
		    str += arguments[j];
		} else {
		    str += pattern[i];
		}
	    }
	    return str;
	},
	append: function (parent, child) {
	    if (parent == undefined) {
		SH.error("append", "parent undefined", child);
	    } else {
		parent.appendChild(child);
	    }
	},
	query: function(elem, selector) {
	    return elem.querySelector(selector);
	},
	queryAll: function(elem, selector) {
	    return elem.querySelectorAll(selector);
	},
	create: function (tag, descr) {
	    var elem = document.createElementNS(SH.xmlns, tag);
	    if (descr != undefined) {
		SH.attr(elem, descr);
	    }
	    return elem;
	},
	attr: function (elem, descr) {
	    for (var attr in descr) {
		var val = descr[attr];
		if (val == undefined || elem == undefined || elem.setAttributeNS == undefined)
		    debugger;
		elem.setAttributeNS(null, attr, val);
	    }
	    return elem;
	},
	bind: function (elem, type, listener) {
	    elem.addEventListener(type, listener);
	},
	text: function (txt) {
	    var elem = SH.create("text");
	    SH.append(elem, document.createTextNode(txt));
	    return elem;
	},
	title: function (elem, txt) {
	    // remove existing title
	    var t = SH.create('title');
	    SH.append(t, document.createTextNode(txt));
	    for (var child of elem.childNodes) {
		if (child.tagName == 'title') {
		    elem.removeChild(child);
		    child = elem.firstElementChild;
		}
	    }
	    elem.appendChild(t);
	    return elem;
	},
	g: function (_) {
	    var elem = SH.create('g');
	    if (_ != undefined) {
		apply(SH.append, [elem].concat(Array.from(arguments)));
	    }
	    return elem;
	},
	rect: function (x, y, width, height, rx, ry) {
	    var elem = SH.create('rect', {
		'x': x || 0,
		'y': y || 0,
		'width': width || 0,
		'height': height || 0,
		'rx': rx || 0,
		'ry': ry || 0,
	    });
	    return elem;
	},
	line: function (x1, y1, x2, y2) {
	    var elem = SH.create('line', {
		'x1': x1 || 0,
		'y1': y1 || 0,
		'x2': x2 || 0,
		'y2': y2 || 0,
	    })
	    return elem;
	},
	path: function () {
	    var elem = SH.create('path');
	    return elem;
	},
	circle: function (cx, cy, r) {
	    var elem = SH.create('circle', {
		'cx': cx || 0,
		'cy': cy || 0,
		'r' : r  || 0,
	    })
	    return elem;
	}
    };
    return SH;
})()
