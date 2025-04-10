export default {
	entries: ['src/index'],
	output: {
		exports: 'named',
	},
	sourcemap: true,
	declaration: true,
	clean: true,
	quiet: true,
	rollup: {
		emitCJS: true,
		dts: {
			respectExternal: false,
		},
	},
};
