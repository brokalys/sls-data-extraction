const webpack       = require('webpack');
const slsw          = require('serverless-webpack');
const nodeExternals = require('webpack-node-externals');

require('dotenv').config();

const env = Object.entries(process.env).reduce(
  (common, [key, value]) => ({
    ...common,
    [`process.env.${key}`]: JSON.stringify(value),
  }),
  {},
);

module.exports = {
  entry: slsw.lib.entries,
  target: 'node',
  mode: slsw.lib.webpack.isLocal ? 'development': 'production',
  optimization: {
    // We no not want to minimize our code.
    minimize: false
  },
  performance: {
    // Turn off size warnings for entry points
    hints: false
  },
  devtool: 'nosources-source-map',
  externals: [nodeExternals()],
  module: {
    rules: [{
      test: /\.js$/,
      loader: 'babel-loader',
      exclude: /node_modules/,
    }],
  },
  plugins: [new webpack.DefinePlugin(env)],
};
