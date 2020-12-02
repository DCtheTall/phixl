const {join, resolve} = require('path');

module.exports = {
  entry: './src/main.js',
  mode: 'development',
  module: {
    rules: [
      {
        test: /\.glsl$/,
        use: {loader: 'raw-loader'},
      },
      {
        test: /\.glsl$/,
        use: {loader: 'glslify-loader'},
      },
    ],
  },
  output: {
    path: join(resolve('.'), 'public/'),
    filename: 'main.js',
  },
  target: 'web',
};
