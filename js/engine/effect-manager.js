function EffectManager(engine) {

    var self = this;
    var gl = null;

    this.effectsById = {};
    this.currentEffect = null;

    this.init = function (callback) {

        self.log('Loading effects...');

        gl = engine.glManager.gl;

        engine.resourceLoader.loadJsonResource('system', 'effects', function (effectsById) {

            self.effectsById = effectsById;

            var effectIds = util.getObjectPropertyNames(effectsById);

            util.recurse(function (recursor, recursionCount) {
                if (recursionCount < effectIds.length) {
                    var effect = effectsById[effectIds[recursionCount]];
                    self.initEffect(effect, recursor);
                } else {
                    self.log('... done.');
                    callback();
                }
            });

        });
    }

    this.useEffect = function (effectId) {

        this.currentEffect = this.effectsById[effectId];

        gl.useProgram(this.currentEffect.shaderProgram);

        return this.currentEffect;
    }

    this.initEffect = function (effect, callback) {

        this.loadShader(effect.id + '-vs', 'vertex', function (shader) {

            effect.vertexShader = shader;

            self.loadShader(effect.id + '-fs', 'fragment', function (shader) {

                effect.fragmentShader = shader;

                effect.shaderProgram = gl.createProgram();
                gl.attachShader(effect.shaderProgram, effect.vertexShader);
                gl.attachShader(effect.shaderProgram, effect.fragmentShader);
                gl.linkProgram(effect.shaderProgram);

                if (!gl.getProgramParameter(effect.shaderProgram, gl.LINK_STATUS)) {

                    var lastError = gl.getProgramInfoLog(effect.shaderProgram);

                    //var compilationLog = gl.getShaderInfoLog(effect.shaderProgram);
                    //console.log('Shader compiler log: ' + compilationLog);

                    throw 'Failed to initialise shader: ' + name + '. Last error: ' + lastError + '.';
                }

                // Setup the effect's attributes.
                for (var attributeName in effect.attributes) {

                    var location = gl.getAttribLocation(effect.shaderProgram, attributeName);
                    if (location < 0) {
                        console.log('Unable to find attribute: ' + attributeName);
                        continue;
                    }

                    effect.attributes[attributeName] = location;
                }

                // Setup the effects uniforms.
                for (var uniformName in effect.uniforms) {

                    var location = gl.getUniformLocation(effect.shaderProgram, uniformName);
                    if (location == null) {
                        console.log('Unable to find uniform: ' + uniformName);
                        continue;
                    }

                    effect.uniforms[uniformName] = location;
                }

                self.log('Loaded effect: ' + effect.id);

                callback();
            });
        });
    }

    this.loadShader = function (shaderId, type, callback) {

        self.log('Loading shader: ' + shaderId);

        engine.resourceLoader.loadTextResource('shader', shaderId, function (data) {

            var shader = null;

            if (type == 'vertex') {

                shader = gl.createShader(gl.VERTEX_SHADER);

            } else if (type == 'fragment') {

                shader = gl.createShader(gl.FRAGMENT_SHADER);

            } else {

                throw 'Unknown shader type: ' + type;
            }

            gl.shaderSource(shader, data);
            gl.compileShader(shader);

            if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {

                throw 'Failed to compile shader: ' + gl.getShaderInfoLog(shader);
            }

            callback(shader);
        });
    }

    this.log = function (message) {

        console.log('Effect Manager: ' + message);
    }
}