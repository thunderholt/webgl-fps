function TextureManager(engine) {

    var self = this;
    var gl = null;

    this.texturesById = {};
    this.loadingTextureIds = {};
    this.failedTextureIds = {};

    this.init = function (callback) {

        gl = engine.glManager.gl;

        callback();
    }

    this.loadTextures = function (textureIds, callback) {

        util.recurse(function (recursor, recursionCount) {
            if (recursionCount < textureIds.length) {
                self.loadTexture(textureIds[recursionCount], recursor);
            } else {
                callback();
            }
        });
    }

    this.loadTexture = function (textureId, callback) {

        callback = callback || function () { }

        if (textureId == null) {
            callback(null);
            return;
        }

        var texture = this.getTexture(textureId);

        if (texture != null) {
            callback(texture);
            return;
        }

        if (this.loadingTextureIds[textureId] || this.failedTextureIds[textureId]) {
            callback(null);
            return;
        }

        this.log('Loading texture: ' + textureId);

        if (textureId.indexOf('-cube') == -1) {

            this.load2dTextureInternal(textureId, callback);

        } else {

            this.loadCubeTextureInternal(textureId, callback);
        }
    }

    this.load2dTextureInternal = function (textureId, callback) {

        this.loadingTextureIds[textureId] = true;

        engine.resourceLoader.loadImageResource('texture', textureId, function (image) {

            var texture = null;

            if (image == null) {

                self.failedTextureIds[textureId] = true;

            } else {

                texture = gl.createTexture();
                gl.bindTexture(gl.TEXTURE_2D, texture);
                gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
                gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
                gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
                gl.bindTexture(gl.TEXTURE_2D, null);

                texture.width = image.width;
                texture.height = image.height;

                self.texturesById[textureId] = texture;
            }

            delete self.loadingTextureIds[textureId];

            callback(texture);
        });
    }

    this.loadCubeTextureInternal = function (textureId, callback) {

        var faces = [
	    	{ faceTextureId: textureId + "-px", cubeFace: gl.TEXTURE_CUBE_MAP_POSITIVE_X, image: null },
	    	{ faceTextureId: textureId + "-nx", cubeFace: gl.TEXTURE_CUBE_MAP_NEGATIVE_X, image: null },
	    	{ faceTextureId: textureId + "-py", cubeFace: gl.TEXTURE_CUBE_MAP_POSITIVE_Y, image: null },
	    	{ faceTextureId: textureId + "-ny", cubeFace: gl.TEXTURE_CUBE_MAP_NEGATIVE_Y, image: null },
	    	{ faceTextureId: textureId + "-pz", cubeFace: gl.TEXTURE_CUBE_MAP_POSITIVE_Z, image: null },
	    	{ faceTextureId: textureId + "-nz", cubeFace: gl.TEXTURE_CUBE_MAP_NEGATIVE_Z, image: null }];

        var allFaceTexturesWereLoaded = true;

        util.recurse(function (recursor, recursionCount) {

            if (recursionCount < faces.length) {
                
                var face = faces[recursionCount];

                engine.resourceLoader.loadImageResource('texture', face.faceTextureId, function (image) {
                    face.image = image;
                    allFaceTexturesWereLoaded = allFaceTexturesWereLoaded && (image != null);
                    recursor();
                });

            } else {

                delete self.loadingTextureIds[textureId];

                var texture = null;

                if (allFaceTexturesWereLoaded) {

                    texture = gl.createTexture();

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, texture);
                    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);

                    for (var i = 0; i < faces.length; i++) {
                        var face = faces[i];
                        gl.texImage2D(face.cubeFace, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, face.image);
                        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
                        gl.texParameteri(gl.TEXTURE_CUBE_MAP, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
                    }

                    gl.bindTexture(gl.TEXTURE_CUBE_MAP, null);

                    self.texturesById[textureId] = texture;

                } else {

                    self.failedTextureIds[textureId] = true;
                }

                callback(texture);
            }
        });
    }

    this.getTexture = function (textureId) {

        if (textureId == null) {
            return null;
        }

        return this.texturesById[textureId];
    }

    this.cleanUp = function () {

        this.log('Cleaning up...');

        for (var textureId in this.texturesById) {

            if (textureId.indexOf('system/') == 0) {
                continue;
            }

            var texture = this.texturesById[textureId];

            gl.deleteTexture(texture);
            delete this.texturesById[textureId];
        }

        this.loadingTextureIds = {};
        this.failedTextureIds = {};

        this.log('... done.');
    }

    this.log = function (message) {

        console.log('Texture Manager: ' + message);
    }
}