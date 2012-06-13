
var STONE_SIZE = 60,
    calculated = {},
    capturedStonePositions = [],
    randomWithinRect = function (rect) {
      return new Vec(
        rect.x + Math.floor(Math.random() * (rect.width - STONE_SIZE)),
        rect.y + Math.floor(Math.random() * (rect.height - STONE_SIZE))
      );
    },
    intersects = function (v) {
      return _.any(capturedStonePositions, function (v2) {
        return Math.abs(v.x - v2.x) < STONE_SIZE && Math.abs(v.y - v2.y) < STONE_SIZE;
      });
    };

ko.bindingHandlers.positionCapturedStoneWithinRect = {
  init: function (element, valueAccessor) {
    var v = valueAccessor(),
        group = v[0],
        id = v[1],
        rect = v[2],
        pos;
    
    calculated[group] = calculated[group] || {};
    if (calculated[group][id]) {
      pos = calculated[group][id];
    } else {
      do {
        pos = randomWithinRect(rect)
      } while (intersects(pos));
      capturedStonePositions.push(pos);
      calculated[group][id] = pos;
    }
    
    $(element).attr("x", pos.x).attr("y", pos.y);
  }
};

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
