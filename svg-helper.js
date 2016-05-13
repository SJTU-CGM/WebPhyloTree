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
	format: function (pattern) {
	    var str = "";
	    var i, j;
	    for (i = j = 0; i < pattern.length; i++) {
		str += (pattern[i] == '%') ? arguments[++j] : pattern[i];
	    }
	    return str;
	},
	append: function (parent, _children) {
	    if (parent == undefined) {
		SH.error("append", "parent undefined", slice(arguments, 1));
	    } else {
		for (var child of slice(arguments, 1)) {
		    parent.appendChild(child);
		}
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
		if (val == undefined)
		    debugger;
		elem.setAttributeNS(null, attr, val);
	    }
	    return elem;
	},
	text: function (txt) {
	    var elem = SH.create("text");
	    SH.append(elem, document.createTextNode(txt));
	    return elem;
	},
	title: function (elem, text) {
	    // remove existing title
	    var telem = SH.create('title');
	    SH.text(telem, text);
	    for (var child of elem.childNodes) {
		if (child.tagName == 'title') {
		    elem.removeChild(child);
		    child = elem.firstElementChild;
		}
	    }
	    elem.appendChild(telem);
	    return telem;
	},
	g: function (_) {
	    var elem = SH.create('g');
	    if (_ != undefined) {
		apply(SH.append, [elem].concat(Array.from(arguments)));
	    }
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
