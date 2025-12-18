export default {
	presets: [
		[
			'@babel/preset-env',
			{
				targets: { node: 'current' },
				modules: false,
			},
		],
	],
	plugins: [
		'@babel/plugin-syntax-import-meta',
		'@babel/plugin-syntax-dynamic-import',
		[
			'@babel/plugin-transform-runtime',
			{
				helpers: true,
				regenerator: true,
			},
		],
	],
};
