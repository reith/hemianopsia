"use strict";

var Bidier = function() {
	var rtl_char_ranges = [[1470, 1470], [1472, 1472], [1475, 1475], [1478, 1478], [1488, 1514], [1520, 1524], [1544, 1544], [1547, 1547], [1549, 1549], [1563, 1563], [1566, 1610], [1645, 1647], [1649, 1749], [1765, 1766], [1774, 1775], [1786, 1805], [1807, 1808], [1810, 1839], [1869, 1957], [1969, 1969], [1984, 2026], [2036, 2037], [2042, 2042], [2048, 2069], [2074, 2074], [2084, 2084], [2088, 2088], [2096, 2110], [2112, 2136], [2142, 2142], [2208, 2208], [2210, 2220], [8207, 8207], [64285, 64285], [64287, 64296], [64298, 64310], [64312, 64316], [64318, 64318], [64320, 64321], [64323, 64324], [64326, 64449], [64467, 64829], [64848, 64911], [64914, 64967], [65008, 65020], [65136, 65140], [65142, 65276], [67584, 67589], [67592, 67592], [67594, 67637], [67639, 67640], [67644, 67644], [67647, 67669], [67671, 67679], [67840, 67867], [67872, 67897], [67903, 67903], [67968, 68023], [68030, 68031], [68096, 68096], [68112, 68115], [68117, 68119], [68121, 68147], [68160, 68167], [68176, 68184], [68192, 68223], [68352, 68405], [68416, 68437], [68440, 68466], [68472, 68479], [68608, 68680], [126464, 126467], [126469, 126495], [126497, 126498], [126500, 126500], [126503, 126503], [126505, 126514], [126516, 126519], [126521, 126521], [126523, 126523], [126530, 126530], [126535, 126535], [126537, 126537], [126539, 126539], [126541, 126543], [126545, 126546], [126548, 126548], [126551, 126551], [126553, 126553], [126555, 126555], [126557, 126557], [126559, 126559], [126561, 126562], [126564, 126564], [126567, 126570], [126572, 126578], [126580, 126583], [126585, 126588], [126590, 126590], [126592, 126601], [126603, 126619], [126625, 126627], [126629, 126633]];
	var neutral_char_ranges = [[9,13], [32,64], [8220, 8221]];

	function char_in_range_array(char_code, range_array) {
		for(var char_code_i = 0; char_code_i < range_array.length; char_code_i ++) {
			if(char_code >= range_array[char_code_i][0]) {
				if (char_code <= range_array[char_code_i][1])
					return true;
			} else break;
		}
		return false;
	}

	function char_denotes_rtl(char_code) {
		return char_in_range_array(char_code, rtl_char_ranges);
	}
	
	function char_is_neutral(char_code) {
		return char_in_range_array(char_code, neutral_char_ranges);
	}

	function text_is_rtl(text) {
		for(var i=0, l=text.length; i < l; i++) {
			var c = text.charCodeAt(i);
			if(char_is_neutral(c))
				continue;
			return char_denotes_rtl(c) ? true : false;
		}
		return false;
	}
	
	function translate_nodes_by_selector(selectors, dom_root) {
		selectors.forEach(function(selector) {
			var nodes = dom_root.querySelectorAll(selector+':not(.rendered-text):not(.rtl-rendered-text)');
			for(var i=0, l=nodes.length; i<l; i++) {
				nodes.item(i).className += text_is_rtl(nodes.item(i).textContent) ? ' rtl-rendered-text' : ' rendered-text';
			}
		});
	}

	function translate_nodes_by_input_event(selectors, dom_root) {
		selectors.forEach(function(selector) {
			var nodes = dom_root.querySelectorAll(selector);
			for (var i=0; nodes.length; i++) {
				nodes.item(i).addEventListener('input', function(e) {
					if (text_is_rtl(e.target.value)) {
						e.target.classList.add('rtl-rendered-text');
					} else if (e.target.classList.contains('rtl-rendered-text')) {
						e.target.classList.remove('rtl-rendered-text');
					}
				}, false);
			}
		});
	}

	function rule_includes_location(re, location) {
		if (typeof re == 'undefined') return true;
		var re_list = re.length ? re : [re];
		for (var i=0; i < re_list.length && !re_list[i].test(location.pathname); i++);
		return (i == re_list.length) ? false : true;
	}
	
	function register_late_translation(selector, dom_root, translator_func, interval) {
		var interval = interval || 3000;

		if (typeof window.MutationObserver != 'undefined') {
			var observer = new MutationObserver(function(records) {
				records.forEach(function(record) {
					if (record.addedNodes != null)
						translator_func(selector, dom_root);
				});
			});
			observer.observe(dom_root, {childList: true, subtree: true});
		} else {
			// TODO: save timer for clearing
			window.setInterval(translator_func, interval, selector, dom_root);
		}
	}


	return {
		run: function(manifest) {
			manifest.forEach(function(rule) {
				if(! rule_includes_location(rule.path_re, window.location)) return;
				var dom_root = (rule.root_selector) ? document.querySelector(rule.root_selector) : document;
				if (dom_root == null) return;
				var translator_func = (rule.input) ? translate_nodes_by_input_event : translate_nodes_by_selector;
				var selectors = (typeof rule.selector == 'string') ? [rule.selector] : rule.selector;

				if (rule.live) {
					register_late_translation(selectors, dom_root, translator_func, rule.interval);
				} else {
					translator_func(selectors, dom_root);
				}
			}, this);
		}
	};
};

function add_style(css) {
  var head = document.getElementsByTagName('head')[0];
  if (head) {
    var style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.textContent = css;
    head.appendChild(style);
  }
}

function prepare_style() {
	add_style('.rtl-rendered-text { direction: rtl; text-align: right; }');
}
