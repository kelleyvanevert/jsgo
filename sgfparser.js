
(function (root, undefined) {

  var grammar = {
        collection         : [ ["gametree", "+", "gametrees"] ],
        gametree           : [ "(", ["sequence", 1, "sequence"], ["gametree", "*", "gametrees"], ")" ],
        sequence           : [ ["node", "+", "nodes"] ],
        node               : [ ";", ["property", "*", "properties"] ],
        property           : [ ["propertyIdentifier", 1, "identifier"], ["propertyValue", "+", "values"] ],
        propertyIdentifier : /^([A-Z]+)/,
        propertyValue      : [ "[", ["cValueType", 1, "value"], "]" ],
        cValueType         : /^((?:\\]|[^\]])*)/
      },
      parseSGF = function (sgf) {
        var r = parseRule("collection", sgf);
        if (!r) return false;
        if (r[1] !== "") return false;
        return r[0];
      },
      parseRule = function (rulename, str) {
        var rule = grammar[rulename];
        str = str.replace(/^\s*/, "");
        if (str === "") return false;
        
        if (rule instanceof RegExp) {
          var m = str.match(rule);
          if (!m) return false;
          return [ m[1], str.slice(m[0].length) ];
        }
        
        var node = {};
        for (var i = 0, seg; (i < rule.length) && (seg = rule[i]); i++) {
          if (typeof seg === "string") {
            if (str.slice(0, seg.length) === seg) {
              str = str.slice(seg.length);
              continue;
            } else {
              return false;
            }
          } else {
            var subrulename = seg[0],
                num = seg[1],
                name = seg[2],
                r;
            
            if (num === 1) {
              r = parseRule(subrulename, str);
              if (!r) {
                // implicit backtracking will occur this way..
                return false;
              }
              str = r[1];
              node[name] = r[0];
            } else {
              node[name] = [];
              while (r = parseRule(subrulename, str)) {
                num = "*";
                str = r[1];
                node[name].push(r[0]);
              }
              if (num === "+")
                return false;
            }
          }
        }
        
        return [ node, str ];
      };
  
  root.parseSGF = parseSGF;

}(this));
