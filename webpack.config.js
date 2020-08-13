const {join, resolve} = require('path');

module.exports = {
  devtool: 'source-map',
  entry: join(resolve('.'), 'src/index.ts'),
  target: 'web',
  output: {
    path: join(resolve('.'), 'dist/'),
    filename: 'index.js',
    library: 'phixl',
    libraryTarget: 'commonjs2',
  },
  resolve: {
    extensions: ['.ts', '.js', '.d.ts'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: {loader: 'ts-loader'},
      },
    ],
  },
};