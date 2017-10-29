const path = require('path');
const webpack = require('webpack');
const ExtractTextPlugin = require("extract-text-webpack-plugin");
const LiveReloadPlugin = require('webpack-livereload-plugin');

const extractSass = new ExtractTextPlugin({
	filename: "styles.css",
	disable: process.env.NODE_ENV != "production",
	// disable: true,
});


module.exports = {
	context: path.resolve(__dirname, "src"),
	entry: './js/index.js',
	output: {
		path: path.resolve(__dirname, "dist"),
		filename: 'bundle.js',
		// publicPath: 'http://wptest.dev/dist/'
	},
	devtool: process.env.NODE_ENV != "production" ? 'cheap-eval-source-map' : 'source-map',
	module: {
		rules: [{
			test: /\.scss$/,
			use: extractSass.extract({
				use: [{
					loader: "css-loader" // translates CSS into CommonJS
				}, {
					loader: "sass-loader", // compiles Sass to CSS
					options: {
						sourceMap: true
					}
				}],
				// use style-loader in development
				fallback: "style-loader" // creates style nodes from JS strings
			})
		}, {
			test: /\.js$/,
			exclude: /node_modules/,
			use: [{
				loader: 'babel-loader',
				options: { presets: ['es2015'] }
			}]
		}]
	},
	plugins: [
		extractSass,
		new LiveReloadPlugin({
			appendScriptTag: true,
		})
	]
}

if ( process.env.NODE_ENV === 'production' ) {
	// const buildFolder = path.resolve( __dirname, 'deploy' );
	module.exports.plugins.push( new webpack.optimize.UglifyJsPlugin( {
		"mangle": {
			"screw_ie8": true
		},
		"compress": {
			"screw_ie8": true,
			"warnings": false
		},
		"sourceMap": false
	} ) );

	// webpackConfig.plugins.push(
	// 	new CleanWebpackPlugin( [ buildFolder ] )
	// );
	//
	// webpackConfig.plugins.push(
	// 	new CopyWebpackPlugin( [
	// 		{ from: path.resolve( __dirname, 'server' ) + '/**', to: buildFolder },
	// 		{ from: path.resolve( __dirname, 'wp-react-boilerplate.php' ), to: buildFolder },
	// 	], {
	//
	// 		// By default, we only copy modified files during
	// 		// a watch or webpack-dev-server build. Setting this
	// 		// to `true` copies all files.
	// 		copyUnmodified: true
	// 	} )
	// );

	// module.exports.output.path = buildFolder + '/dist';
}
