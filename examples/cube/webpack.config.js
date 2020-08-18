const {join, resolve} = require('path');

module.exports = {
  mode: 'development',
  entry: './src/main.js',
  target: 'web',
  output: {
    path: join(resolve('.'), 'public/'),
    filename: 'main.js',
  },
};
