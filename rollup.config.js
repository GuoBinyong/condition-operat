import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import typescript from 'rollup-plugin-typescript2';
import pkg from './package.json';

/**
 * the string separated by the specified separator is converted to hump format
 * 把字符串从分隔线格式转换成驼峰格式
 *
 * @param  str : string    Converted string 被转换的字符串
 * @param separators ?: string | Array<string>   optional; default: ["-","_"] ; separator or separator good array ["-","_"]； 可选；默认值：["-","_"] ；分隔符，或 包含多个分隔符的数组
 * @returns string  return hump format string  返回驼峰格式的字符串
 */
function toHumpFormat(str, separators) {
	if (separators == undefined) {
		separators = ['-', '_'];
	} else if (!Array.isArray(separators)) {
		separators = [separators]
	}
	var separatorRexStr = '(' + separators.join('|') + ')' + '+([A-Za-z]?)'
	var separatorRex = new RegExp(separatorRexStr, 'g');
	return str.replace(separatorRex, function (match, p1, p2) {
		return p2.toUpperCase();
	});
}
  
  

export default [
	// browser-friendly UMD build
	{
		input: 'src/index.ts',
		output: {
			name: toHumpFormat(pkg.name),
			file: pkg.browser,
			format: 'umd'
		},
		plugins: [
			resolve(), // so Rollup can find `ms`
			commonjs(),  // so Rollup can convert `ms` to an ES module
			typescript() // so Rollup can convert TypeScript to JavaScript
		]
	},

	// CommonJS (for Node) and ES module (for bundlers) build.
	// (We could have three entries in the configuration array
	// instead of two, but it's quicker to generate multiple
	// builds from a single configuration where possible, using
	// an array for the `output` option, where we can specify
	// `file` and `format` for each target)
	{
		input: 'src/index.ts',
		external: ['ms'],
		plugins: [
			typescript() // so Rollup can convert TypeScript to JavaScript
		],
		output: [
			{ file: pkg.main, format: 'cjs' },
			{ file: pkg.module, format: 'es' }
		]
	}
];
