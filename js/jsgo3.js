





class TreeElement {
  constructor (name, children, expanded) {
    this.parent = ko.observable();
    
    this.name = ko.observable(name);
    this.children = ko.observableArray(children || []);
    this.expanded = ko.observable(expanded === undefined ? true : expanded);
    this.hasChildren = ko.computed(() => this.children().length > 0);
    
    this.children().map((child) => { child.parent(this); });
    
    this.isFirstChild = ko.computed(() => {
      return this.parent() && (this.parent().children.indexOf(this) == 0);
    });
    this.isLastChild = ko.computed(() => {
      return this.parent() && (this.parent().children.indexOf(this) == this.parent().children().length - 1);
    });
    this.canMoveIn = ko.computed(() => {
      return this.parent() && this.parent().parent();
    });
    this.canMoveOut = ko.computed(() => {
      return this.parent() && (this.parent().children.indexOf(this) > 0);
    });
  }
  
  setParent(node) {
    this.parent(node);
    return this;
  }
  
  // UI
  moveIn() {
    if (this.parent() && this.parent().parent()) {
      var p = this.parent(),
          gp = p.parent(),
          i = p.children.indexOf(this),
          j = gp.children.indexOf(p);
      
      // remove me, and all subsequent siblings
      var subsequents = (p.children.splice(i, p.children().length-i)).slice(1);
      
      // add me back
      this.parent().parent().children.splice(j+1, 0, this);
      this.parent(gp);
      
      // add my subsequents back, as my own children
      subsequents.map((child) => {
        this.children.push(child);
        child.parent(this);
      });
    }
  }
  moveOut() {
    if (this.parent()) {
      var p = this.parent(),
          i = p.children().indexOf(this);
      
      if (i == 0) {
        return;
      }
      
      // remove me
      p.children.remove(this);
      
      // add me back
      var new_parent = p.children()[i-1];
      new_parent.children.push(this);
      this.parent(new_parent);
      
      // transfer all my children to my new parent
      var children = this.children();
      this.children([]);
      children.map((child) => {
        new_parent.children.push(child);
        child.parent(new_parent);
      });
    }
  }
  moveUp() {
    if (this.parent()) {
      var c = this.parent().children(),
          i = c.indexOf(this),
          a = c[i-1],
          b = c[i];
      if (i > 0) {
        this.parent().children.splice(i-1, 2, b, a);
      }
    }
  }
  moveDown() {
    if (this.parent()) {
      var c = this.parent().children(),
          i = c.indexOf(this),
          a = c[i],
          b = c[i+1];
      if (i < c.length - 1) {
        this.parent().children.splice(i, 2, b, a);
      }
    }
  }
  remove() {
    if (this.parent()) {
      this.parent().children.remove(this);
    }
  }
  addBefore () {
    if (this.parent()) {
      var i = this.parent().children.indexOf(this);
      this.parent().children.splice(i, 0, (new TreeElement("(new)")).setParent(this));
    }
  }
  addAfter () {
    if (this.parent()) {
      var i = 1 + this.parent().children.indexOf(this);
      this.parent().children.splice(i, 0, (new TreeElement("(new)")).setParent(this));
    }
  }
  addUnder () {
    this.children.unshift((new TreeElement("(new)")).setParent(this));
  }
}

var tree = new TreeElement("<root>", [
  new TreeElement("Group", [
    new TreeElement("Block(1,1,3)")
  ], false),
  new TreeElement("Group"),
  new TreeElement("Group", [ 
    new TreeElement("Block(0,2,0)"),
    new TreeElement("Group", [ 
      new TreeElement("Block(1,1,3)"),
      new TreeElement("Block(4,2,2)")
    ]) 
  ]),
  new TreeElement("Group", [
      new TreeElement("Block(2,2,1)")
  ])
]);





var UI = {
      gameState: ko.observable(new jsgo.GameState()),
      forward: function () {
        var next = UI.gameState().children[0];
        if (next)
          UI.gameState(next);
      },
      backward: function () {
        var prev = UI.gameState().parent;
        if (prev)
          UI.gameState(prev);
      },
      fastForward: function () {
        var current = UI.gameState(),
            next;
        while (next = current.children[0])
          current = next;
        UI.gameState(current);
      },
      rewind: function () {
        var current = UI.gameState(),
            prev;
        while (prev = current.parent)
          current = prev;
        UI.gameState(current);
      },
      makeMove: function (cell) {
        UI.gameState(UI.gameState().place(new jsgo.Vec(cell.x, cell.y)));
      }
    };

  UI.forwardPossible = ko.computed(function () {
    return UI.gameState().children.length > 0;
  });
  UI.backwardPossible = ko.computed(function () {
    return UI.gameState().parent;
  });
  UI.positions = [];
  for (var y = 0; y < 19; y++) {
    for (var x = 0; x < 19; x++) {
      UI.positions.push(new jsgo.Vec(x, y));
    }
  }




var blocks = ko.observableArray();

var viewModel = { blocks: blocks, treeRoot: tree, UI: UI };

function init2 (e) {
  ko.applyBindings(viewModel);
/*
  for (var i = 0; i < 20; i++) {
    var x = Math.floor(Math.random() * 20),
        y = Math.floor(Math.random() * 20),
        z = 0;
    blocks.push(addStone(x,y,z));
  }
*/
};



window.addEventListener('load', init2, false);
