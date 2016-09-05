var WebTree = (function(){      
    var SvgHelper = (function(){  
        function apply(func, arr) {
          return func.apply(null, arr);
        }
        var SH = {
          xmlns: "http://www.w3.org/2000/svg",
          error: function (msg) {
            throw "SvgHelper: " + msg;
          },
          createTransform: function () {
            return SH.create("svg").createSVGTransform();
          },
          createMatrix: function () {
            return SH.create("svg").createSVGMatrix()
          },
          getRTM: function(sour, term) {
            var path = [];
            while (term != sour && term != null) {
              path.unshift(term);
              term = term.parentElement;
            }
            if (term == null) {
              SH.error("Terminal is not a decendance of source");
            } else {
              var m = SH.createMatrix();
              for (var elem of path) {
                var n = SH.createMatrix();
                for (var trans of Array.from(elem.transform.baseVal)) {
                  n = n.multiply(trans.matrix);
                }
                m = m.multiply(n);
              }
              return m
            }
          },
          translate: function (elem, x, y) {
            var trans = SH.createTransform();
            if (isNaN(x)) debugger;
            trans.setTranslate(x, y);
            elem.transform.baseVal.appendItem(trans);
          },
          setTransform: function (elem, txt) {
            SH.attr(elem, { "transform": txt });
          },
          format: function (pattern) {
            var str = "";
            var i, j;
            for (i = j = 0; i < pattern.length; i++) {
              if (pattern[i] == "%") {
                j += 1;
                /* if (arguments[j] == undefined
                || isNaN(arguments[j]))
                debugger; */
                str += arguments[j];
              } else {
                str += pattern[i];
              }
            }
            return str;
          },
          create: function (tag, descr) {
            var elem = document.createElementNS(SH.xmlns, tag);
            if (descr != undefined) {
              SH.attr(elem, descr);
            }
            return elem;
          },
          createSvg: function () {
            var xml = document.implementation.createDocument(
              "http://www.w3.org/2000/svg",
              "svg"
              );
            return xml.firstElementChild;
          },
          attr: function (elem, descr) {
            for (var attr in descr) {
              var val = descr[attr];
              if (val == undefined || elem == undefined ||
                elem.setAttributeNS == undefined)
              debugger;
              elem.setAttributeNS(null, attr, val);
            }
            return elem;
          },
          text: function (txt) {
            var elem = SH.create("text");
            elem.appendChild(document.createTextNode(txt));
            return elem;
          },
          title: function (elem, txt) {
            // remove existing title
            for (var snode of elem.childNodes) {
              if (snode.tagName == "title") {
                elem.removeChild(snode);
              }
            }
            var telem = SH.create("title");
            SH.append(telem, document.createTextNode(txt));
            elem.appendChild(telem);
            return elem;
          },
          g: function (_) {
            var elem = SH.create("g");
            if (_ != undefined) {
              for (var e of arguments) {
                elem.appendChild(e);
              }
            }
            return elem;
          },
          rect: function (x, y, width, height, rx, ry) {
            var elem = SH.create("rect", {
                "x": x || 0, "y": y || 0,
                "width": width || 0, "height": height || 0,
                "rx": rx || 0, "ry": ry || 0,
            });
            return elem;
          },
          line: function (x1, y1, x2, y2) {
            var elem = SH.create("line", {
                "x1": x1 || 0, "y1": y1 || 0,
                "x2": x2 || 0, "y2": y2 || 0,
            })
            return elem;
          },
          path: function () {
            var elem = SH.create("path");
            return elem;
          },
          circle: function (cx, cy, r) {
            var elem = SH.create("circle", {
                "cx": cx || 0, "cy": cy || 0,"r" : r  || 0,
            })
            return elem;
          }
        };
        return SH;
    })()
    // @help functions
    function dfs(node, func) {
      if (isNode(node)) {
        if (node.subnodes == undefined)
          debugger;
        for (var snode of node.subnodes) {
          dfs(snode, func);
        }
      }
      func(node);
    }
    function bfs(queue, func) {
      if (queue == undefined) debugger;
      queue = queue.slice(0);
      while (queue.length > 0) {
        var node = queue.shift();
        func(node);
        if (isNode(node)) {
          for (var snode of node.subnodes) {
            queue.push(snode);
          }
        }
      }
    }
    function isLeaf(node) {
      return node.subnodes == undefined;
    }
    function isNode(node) {
      return ! isLeaf(node);
    }
    function appendNode(n1, n2) {
      n2.parent = n1;
      n1.subnodes.push(n2);
    }
    // @constructor
    function Node(name, length, data, share) {
      this.name = name;
      this.length = length;
      this.parent = null;
      this.data = data;
      this.share = share;
      this.subnodes = [];
      return this;
    }
    function Leaf(name, length, data, share) {
      this.name = name;
      this.length = length;
      this.parent = null;
      this.data = data;
      this.share = share;
      return this;
    }
    
    // @elements
    var Elements = (function(){
        function createCapsule(node) {
          var caps = SvgHelper.g();
          node.elements = { "capsule": caps };
          node.elem = caps;
        }
        function addBodyElement(node) {
          var body = SvgHelper.g();
          node.elem.appendChild(body);
          node.elements["body"] = body;
        }
        function addBranchLineElement(node) {
          var brch = SvgHelper.path();
          brch.style.fill = "none";
          node.elem.appendChild(brch);
          node.elements["branch"] = brch;
        }
        function addVBranchLineElement(node) {
          var vbrch = SvgHelper.path();
          vbrch.style.fill = "none";
          node.elem.appendChild(vbrch);
          node.elements["vbranch"] = vbrch;
        }
        function addHookElement(node) {
          var hook = SvgHelper.g();
          node.elements["hook"] = hook;
          node.elem.appendChild(hook);
        }
        function addStandardElements(node) {
          createCapsule(node);
          addBodyElement(node);
          addBranchLineElement(node);
          addVBranchLineElement(node);
          addHookElement(node);
        }
        
        return {
          standard: addStandardElements,
        };
    })();
    
    
    // @base
    var Base = {
      viewer: function(node) {
        node.layout = {};
      },
      dynamicViewer: function(node) {
        Base.viewer(node);
      },
    };
    
    // @layout
    var Layout = (function(){
        var L = {}
        function calcLength(node) {
          node.layout["length"] = node.config["branch_unit"] * node.length;
        }
        function calcShift(node) {
          node.layout["shift"] = node.layout["length"];
        }
        function count(root) {
          dfs(root, function(node) {
              if (isLeaf(node)) {
                node.layout["count"] = 1;
              } else {
                node.layout["count"] = 0;
                for (var snode of node.subnodes) {
                  node.layout["count"] += snode.layout["count"];
                }
              }
          });
        }
        function setUnitDegree(root) {
          var unit = 360 / root.layout["count"];
          root.share["unit"] = unit;
        }
        function calcRotate(node) {
          if (isNode(node)) {
            var sum = 0;
            for (var snode of node.subnodes) {
              snode.layout["rotate"] = sum * node.share["unit"];
              sum += snode.layout["count"];
            }
          }
        }
        function calcSpan(node) {
          node.layout["span"] = node.layout["count"] * node.share["unit"];
        }
        function insertToParent(node) {
          if (node.parent) {
            node.parent.elements["body"].appendChild(node.elem);
          }
        }
        function reloadSubnodes(node) {
          if (isNode(node)) {
            while (node.elements["body"].childNodes.length > 0) {
              node.elements["body"].firstSnode.remove();
            }
            node.subnodes.map(insertToParent);
          }
        }
        // @layout @@rectangular
        L.rectangular = (function () {
            function adjust(node) {
              if (isNode(node)) {
                reloadSubnodes(node);
                var path = [];
                while (node) {
                  path.push(node);
                  node = node.parent;
                }
                for (var node of path) {
                  calcBody(node);
                  calcVBranch(node);
                  refresh(node);
                  for (var snode of node.subnodes) {
                    refreshCapsule(snode);
                  }
                }
              }
            }
            function init(root) {
              // set default config
              root.layout["top"] = 0;
              dfs(root, calcBody);
              dfs(root, calcVBranch);
              dfs(root, calcLength);
              dfs(root, calcShift);
              dfs(root, refresh);
              dfs(root, insertToParent);
            }
            function calcBody(node) {
              if (isLeaf(node)) {
                node.layout["size"] = node.config["leaf_size"];
              } else {
                if (node.subnodes.length == 0) {
                  node.layout["size"] = node.config["leaf_size"];
                } else {
                  var size = 0;
                  for (var snode of node.subnodes) {
                    snode.layout["top"] = size;
                    size += snode.layout["size"];
                  }
                  node.layout["size"] = size;
                }
              }
            }
            function calcVBranch(node) {
              if (isLeaf(node) || node.subnodes.length == 0) {
                node.layout["branch_top"] = 0;
                node.layout["branch_bot"] = 0;
                node.layout["joint"] = node.layout["size"] / 2;
              } else {
                var first = node.subnodes[0];
                var last = node.subnodes[node.subnodes.length-1];
                node.layout["branch_top"] = first.layout["joint"];
                node.layout["branch_bot"] = node.layout["size"] - last.layout["size"] + last.layout["joint"];
                node.layout["joint"] = (node.layout["branch_top"] + node.layout["branch_bot"]) / 2;
              }
            }
            function refresh (node) {
              refreshCapsule(node);
              refreshBranchLine(node);
              refreshVBranchLine(node);
              refreshHook(node);
              refreshBody(node);
            }
            function refreshCapsule(node) {
              SvgHelper.attr(node.elem, {
                  "transform": SvgHelper.format("translate(0,%)", node.layout["top"])
              })
            }
            function refreshBranchLine(node) {
              SvgHelper.attr(node.elements["branch"], {
                  "d": SvgHelper.format(
                    "M 0,%  H %",
                    node.layout["joint"],
                    node.layout["length"]
                    )
              })
            }
            function refreshVBranchLine(node) {
              SvgHelper.attr(node.elements["vbranch"], {
                  "d": SvgHelper.format(
                    "M %,%  V %",
                    node.layout["length"],
                    node.layout["branch_top"],
                    node.layout["branch_bot"]
                    )
              })
            }
            function refreshHook(node) {
              SvgHelper.attr(node.elements["hook"], {
                  "transform": SvgHelper.format(
                    "translate(%, %)",
                    node.layout["shift"],
                    node.layout["joint"]
                    ),
              });
            }
            function refreshBody(node) {
              var blen = node.layout["shift"];
              SvgHelper.attr(node.elements["body"], {
                  "transform": SvgHelper.format("translate(%,0)", blen)
              })
            }
            return {
              init: init,
              adjust: adjust,
            };
        })();
        // @layout @@circular
        L.circular = (function(){
            function adjust(node) {
              reloadSubnodes(node);
              calcVBranch(node);
              refreshVBranchLine(node);
              return;
            }
            function init(root) {
              // count unit degree
              count(root);
              setUnitDegree(root);
              // calc other thins
              root.layout["rotate"] = 0;
              bfs([root], calcRotate);
              dfs(root, calcVBranch);
              dfs(root, calcLength);
              dfs(root, calcShift);
              root.layout["radius"] = root.layout["shift"];
              bfs(root.subnodes, calcRadius);
              dfs(root, refresh);
              var depth = 0;
              dfs(root, function(node) {
                  depth = Math.max(node.layout["radius"], depth);
              });
              SvgHelper.setTransform(
                root.elem, SvgHelper.format("translate(%, %)", depth, depth)
                );
              dfs(root, insertToParent);
              return;
            }
            function calcVBranch(node) {
              if (isLeaf(node) || node.subnodes.length == 0) {
                node.layout["vbranch_from"] = 0;
                node.layout["vbranch_to"] = 0;
                node.layout["joint"] = node.share["unit"] / 2;
              } else {
                var first = node.subnodes[0];
                var last = node.subnodes[node.subnodes.length-1];
                node.layout["vbranch_from"] = first.layout["joint"];
                node.layout["vbranch_to"] = last.layout["rotate"] + last.layout["joint"];
                node.layout["joint"] = (node.layout["vbranch_from"] + node.layout["vbranch_to"]) / 2;
              }
            }
            function calcRadius(node) {
              node.layout["radius"] = node.parent.layout["radius"] + node.layout["shift"];
            }
            function refresh (node) {
              refreshCapsule(node);
              refreshBranchLine(node);
              refreshVBranchLine(node);
              refreshHook(node);
            }
            function refreshCapsule(node) {
              SvgHelper.setTransform(
                node.elem,
                SvgHelper.format(
                  "rotate(%)", node.layout["rotate"]
                  )
                );
            }
            function refreshBranchLine(node) {
              SvgHelper.attr(node.elements["branch"], {
                  "d": SvgHelper.format(
                    "M %,0 h -%", node.layout["radius"], node.layout["length"]
                    ),
                  "transform": SvgHelper.format(
                    "rotate(%)", node.layout["joint"]
                    ),
              });
            }
            function refreshVBranchLine(node) {
              var delta = node.layout["vbranch_to"] - node.layout["vbranch_from"];
              var radius = node.layout["radius"];
              SvgHelper.attr(node.elements["vbranch"], {
                  "d": SvgHelper.format(
                    "M %,0  A %,% 0 %,1 %,%",
                    radius,
                    radius, radius,
                    (delta > 180) ? 1 : 0,
                    radius * Math.cos(delta * Math.PI / 180),
                    radius * Math.sin(delta * Math.PI / 180)
                    ),
                  "transform": SvgHelper.format(
                    "rotate(%)", node.layout["vbranch_from"]
                    ),
              });
            }
            function refreshHook(node) {
              SvgHelper.setTransform(
                node.elements["hook"],
                SvgHelper.format(
                  "rotate(%)  translate(%,0)",
                  node.layout["joint"], node.layout["radius"]
                  )
                );
            }
            return {
              init: init,
              adjust: adjust
            };
        })();
        // @layout @@unrooted
        L.unrooted = (function(){
            function adjust(node) {
              reloadSubnodes(node);
            }
            function init(root) {
              count(root);
              setUnitDegree(root);
              root.layout["rotate"] = 0;
              root.length = 0;
              calc(root);
              dfs(root, refresh);
              dfs(root, insertToParent);
              var lef, top;
              dfs(root, function (node) {
                  if (isLeaf(node)) {
                    if (node.elem == undefined) {
                      debugger;
                    }
                    var m = SvgHelper.getRTM(root.elem, node.elements["hook"]);
                    var x = m.e;
                    var y = m.f;
                    lef = (lef == undefined || x < lef) ? x : lef;
                    top = (top == undefined || y < top) ? y : top;
                  }
              })
              SvgHelper.translate(root.elem, -lef, -top);
            }
            function calc(root) {
              bfs([root], calcRotate);
              dfs(root, calcSpan);
              dfs(root, calcLength);
            }
            function refresh(node) {
              refreshCapsule(node);
              refreshBranchLine(node);
              refreshBody(node);
              refreshHook(node);
            }
            function refreshCapsule(node) {
              SvgHelper.setTransform(
                node.elem,
                SvgHelper.format("rotate(%)", node.layout["rotate"])
                );
            }
            function refreshBranchLine(node) {
              SvgHelper.attr(
                node.elements["branch"],
                {
                  "d": SvgHelper.format("M 0,0  H %", node.layout["length"]),
                  "transform": SvgHelper.format("rotate(%)", node.layout["span"]/2),
                }
                );
            }
            function refreshHook(node) {
              SvgHelper.setTransform(
                node.elements["hook"],
                SvgHelper.format(
                  "rotate(%) translate(%,0)",
                  node.layout["span"] / 2,
                  node.layout["length"]
                  )
                );
            }
            function refreshBody(node) {
              SvgHelper.setTransform(
                node.elements["body"],
                SvgHelper.format(
                  "rotate(%) translate(%,0) rotate(%)",
                  node.layout["span"] / 2,
                  node.layout["length"],
                  0 - node.layout["span"] / 2
                  )
                );
            }
            return {
              init: init,
              adjust: adjust,
            };
        })();
        return L;
    })();
    
    // @recipe
    var Recipes = {
      "rectangular": {
        "layout": "rectangular",
        "branch_unit": 4,
        "leaf_size": 32,
      },
      "circular": {
        "layout": "circular",
        "branch_unit": 3,
      },
      "unrooted": {
        "layout": "unrooted",
        "branch_unit": 5,
      }
    };
    
    // @generate
    function generateTree(parentElement, descr, config) {
      function modifiersToOperation(modifiers) {
        return function (obj) {
          for (var proc of modifiers) {
            if (typeof proc != "function") debugger;
            proc(obj);
          }
        };
      }
      function createTree(descr) {
        var name = descr["name"] || "";
        var data = descr["data"] || {};
        var length = descr["length"] || data["branch_length"] || 0;
        if (descr["subnodes"] == undefined || descr["subnodes"].length == 0) {
          return new Leaf(name, length, data, share);
        } else {
          var node = new Node(name, length, data, share);
          for (var sub of descr["subnodes"]) {
            appendNode(node, createTree(sub));
          }
          return node;
        }
      }
      var share = {};
      var root = createTree(descr);
      dfs(root, function(node) {
          Elements.standard(node);
          Base.dynamicViewer(node);
          node.config = config;
          node.root = root;
      })
      parentElement.appendChild(root.elem);
      Layout[config["layout"]].init(root);
      var processNode = modifiersToOperation(config["node_modifiers"]);
      var processLeaf = modifiersToOperation(config["leaf_modifiers"]);
      var processTree = modifiersToOperation(config["tree_modifiers"]);
      dfs(root, function(node){
          if (isNode(node)) {
            processNode(node);
          } else {
            processLeaf(node);
          }
      });
      processTree(root);
      return root;
    }
    
    function deepcopy(obj) {
      return JSON.parse(JSON.stringify(obj));
    }
    
    return (function(){
        function rectangular(descr, conf) {
          var config = Object.assign({}, Recipes["rectangular"], conf);
          return load(descr, config);
        }
        function circular(descr, conf) {
          var config = Object.assign({}, Recipes["circular"], conf);
          return load(descr, config);
        }
        function unrooted(descr, conf) {
          var config = Object.assign({}, Recipes["unrooted"], conf);
          return load(descr, config);
        }
        function load(descr, conf) {
          // raw_recipe ==> recipe
          var baseConf = Recipes[conf["layout"]];
          var config = Object.assign({}, baseConf, conf);
          var extensions = conf.extensions || [];
          config["node_modifiers"] = [];
          config["leaf_modifiers"] = [];
          config["tree_modifiers"] = [];
          for (var e of extensions) {
            var l = e["leaf_modifier"];
            var n = e["node_modifier"];
            var t = e["tree_modifier"];
            if (l != null) {
              config["leaf_modifiers"].push(l);
            }
            if (n != null) {
              config["node_modifiers"].push(n);
            }
            if (t != null) {
              config["tree_modifiers"].push(t);
            }
          }
          // container
          console.log("Generating tree with config: ", config);
          var svg = SvgHelper.createSvg();
          svg.style.stroke = "black";
          var root = generateTree(svg, descr, config);
          return {
            "element": svg,
            "root": root
          };
        }
        return {
          SvgHelper: SvgHelper,
          dfs: dfs, bfs: bfs,
          isLeaf: isLeaf,
          isNode: isNode,
          Recipes: Recipes,
          rectangular: rectangular,
          circular: circular,
          unrooted: unrooted,
          load: load
        };
    })();
})();
