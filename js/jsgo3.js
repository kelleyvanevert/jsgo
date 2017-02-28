





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
    new TreeElement("Russia", [
        new TreeElement("Moscow")
    ], false),
    new TreeElement("Germany"),
    new TreeElement("United States", 
        [ 
            new TreeElement("Atlanta"),
            new TreeElement("New York", [ 
                new TreeElement("Harlem"),
                new TreeElement("Central Park")
            ]) 
        ]),
    new TreeElement("Canada", [
        new TreeElement("Toronto")
    ])
]);






var blocks = ko.observableArray();

var viewModel = { blocks: blocks, treeRoot: tree };

function init2 (e) {
  ko.applyBindings(viewModel);

  for (var i = 0; i < 20; i++) {
    var x = Math.floor(Math.random() * 20),
        y = Math.floor(Math.random() * 10),
        z = -3+Math.floor(Math.random() * 6);
    blocks.push(addBlock(x,y,z));
  }

};



window.addEventListener('load', init2, false);
