const {Shader} = require('../../../dist');

const vertexShader = `
precision mediump float;
`;
const fragmentShader = `
precision highp float;
`;

const canvas = document.getElementById('canvas');

Shader(vertexShader, fragmentShader, {})(canvas);