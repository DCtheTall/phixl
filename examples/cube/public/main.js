/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/main.js");
/******/ })
/************************************************************************/
/******/ ({

/***/ "../../dist/index.js":
/*!******************************************************!*\
  !*** /Users/dylancutler/Desktop/phixl/dist/index.js ***!
  \******************************************************/
/*! no static exports found */
/***/ (function(module, exports) {

eval("module.exports =\n/******/ (function(modules) { // webpackBootstrap\n/******/ \t// The module cache\n/******/ \tvar installedModules = {};\n/******/\n/******/ \t// The require function\n/******/ \tfunction __webpack_require__(moduleId) {\n/******/\n/******/ \t\t// Check if module is in cache\n/******/ \t\tif(installedModules[moduleId]) {\n/******/ \t\t\treturn installedModules[moduleId].exports;\n/******/ \t\t}\n/******/ \t\t// Create a new module (and put it into the cache)\n/******/ \t\tvar module = installedModules[moduleId] = {\n/******/ \t\t\ti: moduleId,\n/******/ \t\t\tl: false,\n/******/ \t\t\texports: {}\n/******/ \t\t};\n/******/\n/******/ \t\t// Execute the module function\n/******/ \t\tmodules[moduleId].call(module.exports, module, module.exports, __webpack_require__);\n/******/\n/******/ \t\t// Flag the module as loaded\n/******/ \t\tmodule.l = true;\n/******/\n/******/ \t\t// Return the exports of the module\n/******/ \t\treturn module.exports;\n/******/ \t}\n/******/\n/******/\n/******/ \t// expose the modules object (__webpack_modules__)\n/******/ \t__webpack_require__.m = modules;\n/******/\n/******/ \t// expose the module cache\n/******/ \t__webpack_require__.c = installedModules;\n/******/\n/******/ \t// define getter function for harmony exports\n/******/ \t__webpack_require__.d = function(exports, name, getter) {\n/******/ \t\tif(!__webpack_require__.o(exports, name)) {\n/******/ \t\t\tObject.defineProperty(exports, name, { enumerable: true, get: getter });\n/******/ \t\t}\n/******/ \t};\n/******/\n/******/ \t// define __esModule on exports\n/******/ \t__webpack_require__.r = function(exports) {\n/******/ \t\tif(typeof Symbol !== 'undefined' && Symbol.toStringTag) {\n/******/ \t\t\tObject.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });\n/******/ \t\t}\n/******/ \t\tObject.defineProperty(exports, '__esModule', { value: true });\n/******/ \t};\n/******/\n/******/ \t// create a fake namespace object\n/******/ \t// mode & 1: value is a module id, require it\n/******/ \t// mode & 2: merge all properties of value into the ns\n/******/ \t// mode & 4: return value when already ns object\n/******/ \t// mode & 8|1: behave like require\n/******/ \t__webpack_require__.t = function(value, mode) {\n/******/ \t\tif(mode & 1) value = __webpack_require__(value);\n/******/ \t\tif(mode & 8) return value;\n/******/ \t\tif((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;\n/******/ \t\tvar ns = Object.create(null);\n/******/ \t\t__webpack_require__.r(ns);\n/******/ \t\tObject.defineProperty(ns, 'default', { enumerable: true, value: value });\n/******/ \t\tif(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));\n/******/ \t\treturn ns;\n/******/ \t};\n/******/\n/******/ \t// getDefaultExport function for compatibility with non-harmony modules\n/******/ \t__webpack_require__.n = function(module) {\n/******/ \t\tvar getter = module && module.__esModule ?\n/******/ \t\t\tfunction getDefault() { return module['default']; } :\n/******/ \t\t\tfunction getModuleExports() { return module; };\n/******/ \t\t__webpack_require__.d(getter, 'a', getter);\n/******/ \t\treturn getter;\n/******/ \t};\n/******/\n/******/ \t// Object.prototype.hasOwnProperty.call\n/******/ \t__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };\n/******/\n/******/ \t// __webpack_public_path__\n/******/ \t__webpack_require__.p = \"\";\n/******/\n/******/\n/******/ \t// Load entry module and return exports\n/******/ \treturn __webpack_require__(__webpack_require__.s = \"./lib/index.ts\");\n/******/ })\n/************************************************************************/\n/******/ ({\n\n/***/ \"./lib/attributes.ts\":\n/*!***************************!*\\\n  !*** ./lib/attributes.ts ***!\n  \\***************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\n\"use strict\";\n\n/**\n * @fileoverview Shader attributes module.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.Mat4Attribute = exports.Mat3Attribute = exports.Mat2Attribute = exports.Vec4Attribute = exports.Vec3Attribute = exports.Vec2Attribute = exports.FloatAttribute = void 0;\nconst attribute = (dimension) => (name, data) => (gl, program) => {\n    const loc = gl.getAttribLocation(program, name);\n    gl.enableVertexAttribArray(loc);\n    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());\n    gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);\n    gl.vertexAttribPointer(loc, dimension, gl.FLOAT, false, 0, 0);\n};\nexports.FloatAttribute = attribute(1);\nexports.Vec2Attribute = attribute(2);\nexports.Vec3Attribute = attribute(3);\nexports.Vec4Attribute = attribute(4);\nexports.Mat2Attribute = attribute(2);\nexports.Mat3Attribute = attribute(3);\nexports.Mat4Attribute = attribute(4);\n\n\n/***/ }),\n\n/***/ \"./lib/constants.ts\":\n/*!**************************!*\\\n  !*** ./lib/constants.ts ***!\n  \\**************************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\n\"use strict\";\n\n/**\n * @fileoverview Constants exported by the library.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.PLANE_VERTICES_TRIANGLE_STRIP = void 0;\nexports.PLANE_VERTICES_TRIANGLE_STRIP = new Float32Array([-1, 1, -1, -1, 1, 1, 1, -1]);\n\n\n/***/ }),\n\n/***/ \"./lib/gl.ts\":\n/*!*******************!*\\\n  !*** ./lib/gl.ts ***!\n  \\*******************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\n\"use strict\";\n\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.render = exports.createProgram = exports.createContext = void 0;\n/**\n * Initialize a WebGL context.\n */\nfunction createContext(canvas) {\n    const gl = canvas.getContext('webgl', { preserveDrawingBuffer: true })\n        || canvas.getContext('experimental-webgl', { preserveDrawingBuffer: true });\n    gl.enable(gl.DEPTH_TEST);\n    gl.depthFunc(gl.LEQUAL);\n    return gl;\n}\nexports.createContext = createContext;\n/**\n * Compile one of the shaders.\n */\nfunction compileShader(gl, shader, src) {\n    gl.shaderSource(shader, src);\n    gl.compileShader(shader);\n    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {\n        console.error(`Shader failed to compile: ${gl.getShaderInfoLog(shader)}`);\n        return null;\n    }\n    return shader;\n}\n/**\n * Create and compile a shader program.\n */\nfunction createProgram(gl, vertexSrc, fragmentSrc) {\n    const vertexShader = compileShader(gl, gl.createShader(WebGLRenderingContext.VERTEX_SHADER), vertexSrc);\n    if (!vertexShader) {\n        throw new Error(`Failed to compile vertex shader.`);\n    }\n    const fragmentShader = compileShader(gl, gl.createShader(WebGLRenderingContext.FRAGMENT_SHADER), fragmentSrc);\n    if (!fragmentShader) {\n        throw new Error(`Failed to compile fragment shader.`);\n    }\n    const program = gl.createProgram();\n    gl.attachShader(program, vertexShader);\n    gl.attachShader(program, fragmentShader);\n    gl.linkProgram(program);\n    return program;\n}\nexports.createProgram = createProgram;\nfunction render(gl, frameBuffer, renderBuffer, nVertices, viewport) {\n    // TODO handle rendering to a frame buffer.\n    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);\n    gl.bindRenderbuffer(gl.RENDERBUFFER, renderBuffer);\n    gl.viewport(...viewport);\n    // TODO drawing types\n    // TODO drawElements\n    gl.drawArrays(gl.TRIANGLE_STRIP, 0, nVertices);\n}\nexports.render = render;\n\n\n/***/ }),\n\n/***/ \"./lib/index.ts\":\n/*!**********************!*\\\n  !*** ./lib/index.ts ***!\n  \\**********************/\n/*! no static exports found */\n/***/ (function(module, exports, __webpack_require__) {\n\n\"use strict\";\n\n/**\n * @fileoverview Lib's main export script.\n */\nObject.defineProperty(exports, \"__esModule\", { value: true });\nexports.Shader = void 0;\nconst gl_1 = __webpack_require__(/*! ./gl */ \"./lib/gl.ts\");\nvar constants_1 = __webpack_require__(/*! ./constants */ \"./lib/constants.ts\");\nObject.defineProperty(exports, \"PLANE_VERTICES_TRIANGLE_STRIP\", { enumerable: true, get: function () { return constants_1.PLANE_VERTICES_TRIANGLE_STRIP; } });\nvar attributes_1 = __webpack_require__(/*! ./attributes */ \"./lib/attributes.ts\");\nObject.defineProperty(exports, \"FloatAttribute\", { enumerable: true, get: function () { return attributes_1.FloatAttribute; } });\nObject.defineProperty(exports, \"Vec2Attribute\", { enumerable: true, get: function () { return attributes_1.Vec2Attribute; } });\n/**\n * Create a shader function to render to a target.\n */\nexports.Shader = (vertexSrc, fragmentSrc, nVertices, init = {}) => (target) => {\n    if (target instanceof HTMLCanvasElement) {\n        const gl = gl_1.createContext(target);\n        const program = gl_1.createProgram(gl, vertexSrc, fragmentSrc);\n        gl.useProgram(program);\n        for (const k of Object.keys(init.attributes || {})) {\n            init.attributes[k](gl, program);\n        }\n        // TODO set viewport.\n        gl_1.render(gl, null, null, 4, [0, 0, target.width, target.height]);\n        return;\n    }\n    throw new Error('Not implemented');\n};\n\n\n/***/ })\n\n/******/ });\n//# sourceMappingURL=index.js.map\n\n//# sourceURL=webpack:////Users/dylancutler/Desktop/phixl/dist/index.js?");

/***/ }),

/***/ "./src/fragment.glsl":
/*!***************************!*\
  !*** ./src/fragment.glsl ***!
  \***************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony default export */ __webpack_exports__[\"default\"] = (\"precision mediump float;\\n#define GLSLIFY 1\\n\\nvarying vec3 color;\\n\\nvoid main() {\\n  gl_FragColor = vec4(color, 1.0);\\n}\\n\");\n\n//# sourceURL=webpack:///./src/fragment.glsl?");

/***/ }),

/***/ "./src/main.js":
/*!*********************!*\
  !*** ./src/main.js ***!
  \*********************/
/*! no static exports found */
/***/ (function(module, exports, __webpack_require__) {

eval("const {\n  PLANE_VERTICES_TRIANGLE_STRIP,\n  FloatAttribute,\n  Vec2Attribute,\n  Shader,\n} = __webpack_require__(/*! ../../../dist */ \"../../dist/index.js\");\n\nconst vertexShader = __webpack_require__(/*! ./vertex.glsl */ \"./src/vertex.glsl\").default;\nconst fragmentShader = __webpack_require__(/*! ./fragment.glsl */ \"./src/fragment.glsl\").default;\n\nconst canvas = document.getElementById('canvas');\n\nShader(vertexShader, fragmentShader, 4, {\n  attributes: {\n    aPosition: Vec2Attribute('a_Position', PLANE_VERTICES_TRIANGLE_STRIP),\n    aRed: FloatAttribute('a_Red', new Float32Array([1, 1, 0, 0])),\n    aGreen: FloatAttribute('a_Green', new Float32Array([0, 1, 1, 0])),\n    aBlue: FloatAttribute('a_Blue', new Float32Array([0, 0, 1, 1])),\n  },\n})(canvas);\n\n//# sourceURL=webpack:///./src/main.js?");

/***/ }),

/***/ "./src/vertex.glsl":
/*!*************************!*\
  !*** ./src/vertex.glsl ***!
  \*************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony default export */ __webpack_exports__[\"default\"] = (\"precision mediump float;\\n#define GLSLIFY 1\\n\\nattribute float a_Red;\\nattribute float a_Green;\\nattribute float a_Blue;\\nattribute vec2 a_Position;\\n\\nvarying vec3 color;\\n\\nvoid main() {\\n  gl_Position = vec4(a_Position, 0.0, 1.0);\\n  color = vec3(a_Red, a_Green, a_Blue);\\n}\\n\");\n\n//# sourceURL=webpack:///./src/vertex.glsl?");

/***/ })

/******/ });