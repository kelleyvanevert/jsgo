
var game = new jsgo.Game();

var keyDownActions = {
  "40": function () { game.backward()    }, // down
  "38": function () { game.forward()     }, // up
  "37": function () { game.backward()    }, // left
  "39": function () { game.forward()     }, // right
  "36": function () { game.rewind()      }, // home
  "35": function () { game.fastForward() }, // end
  "9": function (e) {
    var n = game.history().rotateActiveChild(e.shiftKey ? -1 : 1);
  } // tab
};

$(function () {
  $(window).keydown(function (e) {
    if (keyDownActions.hasOwnProperty("" + e.which)) {
      keyDownActions["" + e.which](e);
      e.preventDefault();
      return false;
    }
  });
  ko.applyBindings(game, $("#html")[0]);
});
