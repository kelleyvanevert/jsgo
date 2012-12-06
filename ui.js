
/*
  This loadSGF is not very tolerant,
    will very likely throw exceptions!!
*/
var loadSGFVariation = function (sgf, game) {
      // place moves
      for (var i = 0; i < sgf.sequence.nodes.length; i++) {
        var move_prop = sgf.sequence.nodes[i].properties[0],
            color = move_prop.identifier;

        if ("WB".split("").indexOf(color) < 0)
          throw "[loadSGFVariation] move property identifier not W, B or C";

        if (color.toLowerCase() != game.turn()[0].toLowerCase())
          throw "[loadSGFVariation] white/black turn error";

        var coord_str = move_prop.values[0].value.match(/^([a-s])([a-s])$/),
            vec = new jsgo.Vec(coord_str[1].charCodeAt(0) - 97, coord_str[2].charCodeAt(0) - 97);

        game.place(vec);
      }
      var nMovesPlayed = i;

      // recurse for variation
      for (var i = 0; i < sgf.gametrees.length; i++) {
        loadSGFVariation(sgf.gametrees[i], game);
      }

      // rewind this particular variation tree
      for (var i = 0; i < nMovesPlayed; i++)
        game.backward();

      return game;
    },
    SGFtoGame = function (sgf_str) {
      try {
        var sgf = parseSGF(sgf_str);
        return loadSGFVariation(sgf.gametrees[0], new jsgo.Game());
      } catch (e) {
        return false;
      }
    },
    UI = {
      game: ko.observable(new jsgo.Game())
    },
    keyDownActions = {
      "40": function () { UI.game().backward()    }, // down
      "38": function () { UI.game().forward()     }, // up
      "37": function () { UI.game().backward()    }, // left
      "39": function () { UI.game().forward()     }, // right
      "36": function () { UI.game().rewind()      }, // home
      "35": function () { UI.game().fastForward() }, // end
      "9": function (e) {
        var n = UI.game().history().rotateActiveChild(e.shiftKey ? -1 : 1);
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
  ko.applyBindings(UI, $("#html")[0]);
});
