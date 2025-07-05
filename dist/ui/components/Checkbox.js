'use strict';
var __rest =
	(this && this.__rest) ||
	function (s, e) {
		var t = {};
		for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0) t[p] = s[p];
		if (s != null && typeof Object.getOwnPropertySymbols === 'function')
			for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
				if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i])) t[p[i]] = s[p[i]];
			}
		return t;
	};
Object.defineProperty(exports, '__esModule', { value: true });
const jsx_runtime_1 = require('react/jsx-runtime');
const Checkbox = _a => {
	var { checked, onChange, id } = _a,
		rest = __rest(_a, ['checked', 'onChange', 'id']);
	return (0, jsx_runtime_1.jsx)(
		'input',
		Object.assign(
			{
				type: 'checkbox',
				role: 'checkbox',
				checked: checked,
				onChange: onChange,
				id: id,
				style: { width: 18, height: 18, accentColor: '#0070f3', cursor: 'pointer' },
			},
			rest
		)
	);
};
exports.default = Checkbox;
