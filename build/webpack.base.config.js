const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const FriendlyErrorsPlugin = require('friendly-errors-webpack-plugin');
const { VueLoaderPlugin } = require('vue-loader');
const UglifyJSPlugin = require('uglifyjs-webpack-plugin');

const isProd = process.env.NODE_ENV === 'production';

module.exports = {
	devtool: isProd ? false : '#cheap-module-source-map',
	output: {
		path: path.resolve(__dirname, '../dist'),
		publicPath: '/dist/',
		filename: '[name].[chunkhash].js'
	},
	resolve: {
		alias: {
			public: path.resolve(__dirname, '../public'),
			'@': path.join(__dirname, '..', 'client'),
			vue: 'vue/dist/vue.common.js'
		}
	},
	module: {
		noParse: /es6-promise\.js$/, // avoid webpack shimming process
		rules: [
			{
				test: /\.vue$/,
				loader: 'vue-loader',
				options: {
					compilerOptions: {
						preserveWhitespace: false
					}
				}
				// include: [require.resolve('vue-infinite-loading'), './client']
				// path.resolve(__dirname, './node_modules/vue-infinite-loading'), path.resolve(__dirname, 'client')
				// exclude:/node_modules\/(?!(vue-infinite-loading)\/).*/
			},
			{
				test: /\.js$/,
				// loader: 'babel-loader',
				use: {
					loader: 'babel-loader',
					options: {
						presets: ['env']
					}
				},
				exclude: /node_modules/,
				include: [
					require.resolve('bootstrap-vue'),
					require.resolve('epic-spinners'),
					'/node_modules/bootstrap-vue/',
					'/node_modules/bootstrap/'
				]
			},
			{
				test: /\.(png|jpg|gif|svg|ttf|woff2|woff|eot)$/,
				loader: 'url-loader',
				options: {
					limit: 10000,
					name: '[name].[ext]?[hash]'
				}
			},
			{
				test: /\.styl(us)?$/,
				use: isProd
					? ExtractTextPlugin.extract({
							use: [
								{
									loader: 'css-loader',
									options: { minimize: true }
								},
								'stylus-loader'
							],
							fallback: 'vue-style-loader'
					  })
					: ['vue-style-loader', 'css-loader', 'stylus-loader']
			},
			{
				test: /\.scss?$/,
				loaders: ['style-loader', 'css-loader', 'sass-loader']
			},
			{
				test: /\.css?$/,
				loader: ExtractTextPlugin.extract({
					use: {
						loader: 'css-loader',
						options: { minimize: isProd }
					},
					fallback: 'vue-style-loader'
				})
				/*
				test: /\.css?$/,
				use: isProd ? ExtractTextPlugin.extract({
					use: [
						{
							loader: 'css-loader',
							options: { minimize: false }
						}
					],
					fallback: 'vue-style-loader'
				})
				: ['style-loader', 'css-loader', 'sass-loader']
				*/
			},
			{
				test: /\.less$/,
				use: [{ loader: 'style-loader' }, { loader: 'css-loader' }, { loader: 'less-loader' }]
			}
		]
	},
	performance: {
		maxEntrypointSize: 300000,
		hints: isProd ? 'warning' : false
	},
	plugins: isProd
		? [
				new VueLoaderPlugin(),
				// new webpack.optimize.UglifyJsPlugin({
				// 	compress: { warnings: false }
				// }),
				new UglifyJSPlugin(),
				new webpack.optimize.ModuleConcatenationPlugin(),
				new ExtractTextPlugin({
					filename: 'common.[chunkhash].css'
				})
		  ]
		: [
				new VueLoaderPlugin(),
				new ExtractTextPlugin({
					filename: 'common.[chunkhash].css'
				}),
				new FriendlyErrorsPlugin()
		  ]
};
