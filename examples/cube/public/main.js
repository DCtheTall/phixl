!function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s=0)}([function(e,t,r){const{PLANE_VERTICES_TRIANGLE_STRIP:n,PLANE_TEX_COORDS_TRIANGLE_STRIP:o,Shader:i,Vec2Attribute:a,Texture2DUniform:u}=r(1);document.getElementById("texture").onload=function(){const e=r(2).default,t=r(3).default,f=document.getElementById("canvas"),c=document.getElementById("texture");i(4,e,t,{attributes:{aPosition:a("a_Position",n),aTexCoords:a("a_TexCoords",o)},uniforms:{uTexture:u("u_Texture",c)}})(f)}},function(e,t){e.exports=function(e){var t={};function r(n){if(t[n])return t[n].exports;var o=t[n]={i:n,l:!1,exports:{}};return e[n].call(o.exports,o,o.exports,r),o.l=!0,o.exports}return r.m=e,r.c=t,r.d=function(e,t,n){r.o(e,t)||Object.defineProperty(e,t,{enumerable:!0,get:n})},r.r=function(e){"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(e,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(e,"__esModule",{value:!0})},r.t=function(e,t){if(1&t&&(e=r(e)),8&t)return e;if(4&t&&"object"==typeof e&&e&&e.__esModule)return e;var n=Object.create(null);if(r.r(n),Object.defineProperty(n,"default",{enumerable:!0,value:e}),2&t&&"string"!=typeof e)for(var o in e)r.d(n,o,function(t){return e[t]}.bind(null,o));return n},r.n=function(e){var t=e&&e.__esModule?function(){return e.default}:function(){return e};return r.d(t,"a",t),t},r.o=function(e,t){return Object.prototype.hasOwnProperty.call(e,t)},r.p="",r(r.s="./lib/index.ts")}({"./lib/attributes.ts":
/*!***************************!*\
  !*** ./lib/attributes.ts ***!
  \***************************/
/*! no static exports found */function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Mat4Attribute=t.Mat3Attribute=t.Mat2Attribute=t.Vec4Attribute=t.Vec3Attribute=t.Vec2Attribute=t.FloatAttribute=void 0;const n=e=>(t,r)=>(n,o)=>{const i=n.getAttribLocation(o,t);n.enableVertexAttribArray(i),n.bindBuffer(n.ARRAY_BUFFER,n.createBuffer()),n.bufferData(n.ARRAY_BUFFER,r,n.STATIC_DRAW),n.vertexAttribPointer(i,e,n.FLOAT,!1,0,0)};t.FloatAttribute=n(1),t.Vec2Attribute=n(2),t.Vec3Attribute=n(3),t.Vec4Attribute=n(4);const o=e=>(t,r)=>(n,o)=>{const i=n.getAttribLocation(o,t);for(let t=0;t<e;t++)n.enableVertexAttribArray(i+t),n.bindBuffer(n.ARRAY_BUFFER,n.createBuffer()),n.bufferData(n.ARRAY_BUFFER,r[t],n.STATIC_DRAW),n.vertexAttribPointer(i+t,e,n.FLOAT,!1,0,0)};t.Mat2Attribute=o(2),t.Mat3Attribute=o(3),t.Mat4Attribute=o(4)},"./lib/constants.ts":
/*!**************************!*\
  !*** ./lib/constants.ts ***!
  \**************************/
/*! no static exports found */function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.PLANE_TEX_COORDS_TRIANGLE_STRIP=t.PLANE_VERTICES_TRIANGLE_STRIP=void 0,t.PLANE_VERTICES_TRIANGLE_STRIP=new Float32Array([-1,1,1,1,-1,-1,1,-1]),t.PLANE_TEX_COORDS_TRIANGLE_STRIP=new Float32Array([0,0,1,0,0,1,1,1])},"./lib/gl.ts":
/*!*******************!*\
  !*** ./lib/gl.ts ***!
  \*******************/
/*! no static exports found */function(e,t,r){"use strict";function n(e,t,r){return e.shaderSource(t,r),e.compileShader(t),e.getShaderParameter(t,e.COMPILE_STATUS)?t:(console.error("Shader failed to compile: "+e.getShaderInfoLog(t)),null)}Object.defineProperty(t,"__esModule",{value:!0}),t.render=t.createProgram=t.createContext=void 0,t.createContext=function(e){const t=e.getContext("webgl",{preserveDrawingBuffer:!0})||e.getContext("experimental-webgl",{preserveDrawingBuffer:!0});return t.enable(t.DEPTH_TEST),t.depthFunc(t.LEQUAL),t},t.createProgram=function(e,t,r){const o=n(e,e.createShader(WebGLRenderingContext.VERTEX_SHADER),t);if(!o)throw new Error("Failed to compile vertex shader.");const i=n(e,e.createShader(WebGLRenderingContext.FRAGMENT_SHADER),r);if(!i)throw new Error("Failed to compile fragment shader.");const a=e.createProgram();return e.attachShader(a,o),e.attachShader(a,i),e.linkProgram(a),a},t.render=function(e,t,r,n,o,i){e.bindFramebuffer(e.FRAMEBUFFER,t),e.bindRenderbuffer(e.RENDERBUFFER,r),e.viewport(...o),e.drawArrays(i,0,n)}},"./lib/index.ts":
/*!**********************!*\
  !*** ./lib/index.ts ***!
  \**********************/
/*! no static exports found */function(e,t,r){"use strict";var n=this&&this.__createBinding||(Object.create?function(e,t,r,n){void 0===n&&(n=r),Object.defineProperty(e,n,{enumerable:!0,get:function(){return t[r]}})}:function(e,t,r,n){void 0===n&&(n=r),e[n]=t[r]}),o=this&&this.__exportStar||function(e,t){for(var r in e)"default"===r||t.hasOwnProperty(r)||n(t,e,r)};Object.defineProperty(t,"__esModule",{value:!0}),t.Shader=void 0;const i=r(/*! ./gl */"./lib/gl.ts");o(r(/*! ./attributes */"./lib/attributes.ts"),t),o(r(/*! ./constants */"./lib/constants.ts"),t),o(r(/*! ./uniforms */"./lib/uniforms.ts"),t);const a={attributes:{},uniforms:{},mode:WebGLRenderingContext.TRIANGLE_STRIP};t.Shader=(e,t,r,n=a)=>o=>{if(!(o instanceof HTMLCanvasElement))throw new Error("Not implemented");{const u=i.createContext(o),f=i.createProgram(u,t,r);u.useProgram(f);for(const e of Object.keys(n.attributes||{}))n.attributes[e](u,f);for(const e of Object.keys(n.uniforms||{}))n.uniforms[e](u,f);i.render(u,null,null,e,n.viewport||[0,0,o.width,o.height],n.mode||a.mode)}}},"./lib/math.ts":
/*!*********************!*\
  !*** ./lib/math.ts ***!
  \*********************/
/*! no static exports found */function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.isPowerOfTwo=void 0,t.isPowerOfTwo=e=>0==(e&e-1)},"./lib/uniforms.ts":
/*!*************************!*\
  !*** ./lib/uniforms.ts ***!
  \*************************/
/*! no static exports found */function(e,t,r){"use strict";Object.defineProperty(t,"__esModule",{value:!0}),t.Texture2DUniform=t.Mat4Uniform=t.Mat3Uniform=t.Mat2Uniform=t.Vec4Uniform=t.Vec3Uniform=t.Vec2Uniform=t.IntegerUniform=t.FloatUniform=t.BooleanUniform=void 0;const n=r(/*! ./math */"./lib/math.ts");var o;!function(e){e.BOOLEAN="boolean",e.FLOAT="float",e.INTEGER="integer"}(o||(o={}));const i=e=>(t,r)=>(n,i)=>{if(isNaN(r))throw TypeError(`Data for ${e} uniform should be a number`);const a=n.getUniformLocation(i,t);switch(e){case o.BOOLEAN:n.uniform1i(a,r);break;case o.FLOAT:n.uniform1f(a,r);break;case o.INTEGER:n.uniform1i(a,r)}};var a;t.BooleanUniform=i(o.BOOLEAN),t.FloatUniform=i(o.FLOAT),t.IntegerUniform=i(o.INTEGER),function(e){e.VECTOR="vec",e.MATRIX="mat"}(a||(a={}));const u=(e,t)=>(r,n)=>(o,i)=>{const u=o.getUniformLocation(i,r);if(e==a.VECTOR){if(n.length!=t)throw new TypeError(`Dimension mismatch for a ${e}${t} uniform`);switch(t){case 2:o.uniform2fv(u,n);case 3:o.uniform3fv(u,n);case 4:o.uniform4fv(u,n)}}else{if(n.length!=Math.pow(t,2))throw new TypeError(`Dimension mismatch for a ${e}${t} uniform`);switch(t){case 2:o.uniformMatrix2fv(u,!1,n);case 3:o.uniformMatrix3fv(u,!1,n);case 4:o.uniformMatrix4fv(u,!1,n)}}};t.Vec2Uniform=u(a.VECTOR,2),t.Vec3Uniform=u(a.VECTOR,3),t.Vec4Uniform=u(a.VECTOR,4),t.Mat2Uniform=u(a.MATRIX,2),t.Mat3Uniform=u(a.MATRIX,3),t.Mat4Uniform=u(a.MATRIX,4);const f=new WeakMap;t.Texture2DUniform=(e,t)=>(r,o)=>{const i=f.get(o)||0;if(32===i)throw new Error("Already at maximum number of textures for this program");f.set(o,i+1);const a=r.createTexture(),u=r.getUniformLocation(o,e);r.uniform1i(u,i),r.bindTexture(r.TEXTURE_2D,a),r.texImage2D(r.TEXTURE_2D,0,r.RGBA,r.RGBA,r.UNSIGNED_BYTE,t),n.isPowerOfTwo(t.width)&&n.isPowerOfTwo(t.height)?r.generateMipmap(r.TEXTURE_2D):(r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_S,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_WRAP_T,r.CLAMP_TO_EDGE),r.texParameteri(r.TEXTURE_2D,r.TEXTURE_MIN_FILTER,r.LINEAR)),r.activeTexture(r.TEXTURE0+i),r.bindTexture(r.TEXTURE_2D,a)}}})},function(e,t,r){"use strict";r.r(t),t.default="precision mediump float;\n#define GLSLIFY 1\n\nattribute vec2 a_Position;\nattribute vec2 a_TexCoords;\n\nvarying vec2 v_TexCoords;\n\nvoid main() {\n  v_TexCoords = a_TexCoords;\n  gl_Position = vec4(a_Position, 0.0, 1.0);\n}\n"},function(e,t,r){"use strict";r.r(t),t.default="precision mediump float;\n#define GLSLIFY 1\n\nuniform sampler2D u_Texture;\n\nvarying vec2 v_TexCoords;\n\nvoid main() {\n  gl_FragColor = texture2D(u_Texture, v_TexCoords);\n}\n"}]);