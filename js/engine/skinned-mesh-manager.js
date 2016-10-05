function SkinnedMeshManager(engine) {

    var self = this;
    var gl = null;

    this.skinnedMeshesById = {};
    this.loadingSkinnedMeshIds = {};
    this.failedSkinnedMeshIds = {};

    this.init = function (callback) {

        gl = engine.glManager.gl;

        callback();
    }

    this.loadSkinnedMesh = function (skinnedMeshId, options, callback) {

        options = options || {};

        callback = callback || function () { }

        if (skinnedMeshId == null) {
            callback(null);
            return;
        }

        var skinnedMesh = this.skinnedMeshesById[skinnedMeshId];

        if (skinnedMesh != null) {
            callback(skinnedMesh);
            return;
        }

        if (this.loadingSkinnedMeshIds[skinnedMeshId] || this.failedSkinnedMeshIds[skinnedMeshId]) {
            callback(null);
            return;
        }

        this.log('Loading skinned mesh: ' + skinnedMeshId);

        this.loadingSkinnedMeshIds[skinnedMeshId] = skinnedMeshId;

        engine.resourceLoader.loadJsonResource('skinned-mesh', skinnedMeshId, function (skinnedMesh) {

            if (skinnedMesh == null) {

                self.failedSkinnedMeshIds[skinnedMeshId] = true;

            } else {

                self.initSkinnedMesh(skinnedMesh, options);

                self.skinnedMeshesById[skinnedMeshId] = skinnedMesh;
            }

            delete self.loadingSkinnedMeshIds[skinnedMeshId];

            callback(skinnedMesh);
        });
    }

    this.getSkinnedMesh = function (skinnedMeshId) {

        if (skinnedMeshId == null) {
            return null;
        }

        return this.skinnedMeshesById[skinnedMeshId];
    }

    this.initSkinnedMesh = function (skinnedMesh, options) {

        skinnedMesh.numberOfFaces = skinnedMesh.verts.length / 3;

        skinnedMesh.buffers = {
            vertexBuffer: gl.createBuffer(),
            normalsBuffer: gl.createBuffer(),
            texCoordBuffer: gl.createBuffer(),

            firstBoneIndexes: gl.createBuffer(),
            secondBoneIndexes: gl.createBuffer(),
            thirdBoneIndexes: gl.createBuffer(),
            fourthBoneIndexes: gl.createBuffer(),
            //fifthBoneIndexes: gl.createBuffer(),

            firstWeights: gl.createBuffer(),
            secondWeights: gl.createBuffer(),
            thirdWeights: gl.createBuffer(),
            fourthWeights: gl.createBuffer(),
            //fifthWeights: gl.createBuffer(),
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.verts), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.uvs), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.firstBoneIndexes);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.firstBoneIndexes), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.secondBoneIndexes);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.secondBoneIndexes), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.thirdBoneIndexes);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.thirdBoneIndexes), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.fourthBoneIndexes);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.fourthBoneIndexes), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.firstWeights);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.firstWeights), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.secondWeights);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.secondWeights), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.thirdWeights);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.thirdWeights), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, skinnedMesh.buffers.fourthWeights);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(skinnedMesh.fourthWeights), gl.STATIC_DRAW);

        delete skinnedMesh.verts;
        delete skinnedMesh.normals;
        delete skinnedMesh.uvs;
        delete skinnedMesh.firstBoneIndexes;
        delete skinnedMesh.secondBoneIndexes;
        delete skinnedMesh.thirdBoneIndexes;
        delete skinnedMesh.fourthBoneIndexes;
        delete skinnedMesh.firstWeights;
        delete skinnedMesh.secondWeights;
        delete skinnedMesh.thirdWeights;
        delete skinnedMesh.fourthWeights;
    }

    this.cleanUp = function () {

        this.log('Cleaning up...');

        for (var skinnedMeshId in this.skinnedMeshesById) {

            var skinnedMesh = this.skinnedMeshesById[skinnedMeshId];

            this.cleanUpSkinnedMeshBuffers(skinnedMesh)
        }

        this.skinnedMeshesById = {};

        this.log('... done.')
    }

    this.cleanUpSkinnedMeshBuffers = function (skinnedMesh) {

        for (var bufferName in skinnedMesh.buffers) {

            var buffer = skinnedMesh.buffers[bufferName];

            if (buffer != null) {
                gl.deleteBuffer(buffer);
            }
        }
    }

    this.log = function (message) {

        console.log('Skinned Mesh Manager: ' + message);
    }
}