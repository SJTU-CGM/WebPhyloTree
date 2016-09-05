/*
    <Extension> ::= {
        leaf_modifier : <Function> | null,
        node_modifier : <Function> | null,
        tree_modifier : <Function> | null
    }
*/

"use strict";


(function(WT){
  var SH = WT.SvgHelper;
  var E = {};
  WT.Extensions = E;
  
  
  E._Pattern = {
    "leaf_modifier": null,
    "node_modifier": null,
    "tree_modifier": null
  }
  
  
  E.ExtendBranch = {
    "leaf_modifier": null,
    "node_modifier": null,
    "tree_modifier": function(root) {
      var maxDepth = 0;
      root.layout["depth"] = 0;
      WT.bfs(root.subnodes, function(node){
        node.layout["depth"] = node.parent.layout["depth"] + node.layout["length"];
        maxDepth = Math.max(maxDepth, node.layout["depth"]);
      });
      WT.dfs(root, function(node){
        if (WT.isLeaf(node)) {
          var delta = maxDepth - node.layout["depth"];
          var ebranch = WT.SvgHelper.line(-delta, 0, 0, 0);
          node.layout["shift"] += delta;
          node.elements["hook"].appendChild(ebranch);
          node.elements["ebranch"] = ebranch;
          // translate
          var trans = document.querySelector("svg").createSVGTransform();
          trans.setTranslate(delta, 0);
          node.elements["hook"].transform.baseVal.appendItem(trans);
        }
        return;
      });
      return;
    }
  };
  
  /*
  E.RotateLabel = {
    "leaf_modifier": function(leaf) {
      if (leaf.subnodes == undefined) {
        var m = WebTree.SvgHelper.getRTM(leaf.root.elem, leaf.elements["hook"]);
        console.log(m);
        if (m.a < 0) {
          var label = leaf.elements["label"];
          var BOX = label.getBBox();
          var trans = document.querySelector("svg").createSVGTransform();
          trans.setRotate(180, 0, 0);
          leaf.elements["label"].transform.baseVal.appendItem(trans);
          var trans = document.querySelector("svg").createSVGTransform();
          trans.setTranslate(-BOX.width, 0);
          leaf.elements["label"].transform.baseVal.appendItem(trans);
        }
      }
      return;
    },
    "node_modifier": null,
    "tree_modifier": null
  };
  */
  
  E.Select = {
    "leaf_modifier": null,
    "node_modifier": null,
    "tree_modifier": function(node) {
      if (node.subnodes == undefined) { // is leaf
        node.select = function() {
          node.elem.classList.add('selected');
        };
        node.unselect = function() {
          node.elem.classList.remove('selected');
        };
      } else {
        node.select = function() {
          for (var sub of node.subnodes)
          sub.select();
        }
        node.unselect = function () {
          for (var sub of node.subnodes)
          sub.unselect();
        }
      }
      return;
    }
  };
  
  
  E.GetNodeByName = {
    "leaf_modifier": null,
    "node_modifier": null,
    "tree_modifier": function(root) {
      var map = {};
      WT.dfs(root, function(node){
        map[node.name] = node;
        node.getNodeByName = function(name) { return map[name]; }
      });
      return;
    }
  };
  
  
  
  E.LeafLabel = {
    "leaf_modifier": function (node) {
      var label = WT.SvgHelper.text(node.name);
      label.style.dominantBaseline = "middle";
      label.style.fontFamily = "Monospace";
      label.style.fontSize = 15;
      node.elements["hook"].appendChild(label);
      node.elements["label"] = label;
      return;
    },
    "node_modifier": null,
    "tree_modifier": function (root) {
      if (root.config.layout == "circular") {
        var len = 0;
        WT.dfs(root, function(node){
          if (WT.isLeaf(node)) {
            len = Math.max(len, node.name.length);
          }
          return;
        });
        var mov = len * 10; // font-size: 15px;
        SH.translate( root.elem, mov, mov );
      }
      return;
    }
  }
  
  
  E.LeafButton = {
    "leaf_modifier": function(node) {
      var labelBtn = WT.SvgHelper.rect(0, -16, 50, 28);
      node.elements["hook"].appendChild(labelBtn);
      node.elements["label_button"] = labelBtn;
      return;
    },
    "node_modifier": null,
    "tree_modifier": null
  }
  
  
  E.NodeButton = {
    "leaf_modifier": null,
    "node_modifier": function (node) {
      var button = WT.SvgHelper.circle(0, 0, 5);
      node.elements["hook"].appendChild(button);
      node.elements["button"] = button;
      return;
    },
    "tree_modifier": null
  }
  
  
  return;
})(WebTree);
