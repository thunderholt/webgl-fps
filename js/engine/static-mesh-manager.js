function StaticMeshManager(engine) {

    var self = this;
    var gl = null;

    this.staticMeshesById = {};
    this.loadingStaticMeshIds = {};
    this.failedStaticMeshIds = {};

    this.init = function (callback) {

        gl = engine.glManager.gl;

        callback();
    }

    this.loadStaticMesh = function (staticMeshId, options, callback) {

        options = options || {};

        callback = callback || function () { }

        if (staticMeshId == null) {
            callback(null);
            return;
        }

        var staticMesh = this.staticMeshesById[staticMeshId];

        if (staticMesh != null) {
            callback(staticMesh);
            return;
        }

        if (this.loadingStaticMeshIds[staticMeshId] || this.failedStaticMeshIds[staticMeshId]) {
            callback(null);
            return;
        }

        this.log('Loading static mesh: ' + staticMeshId);

        this.loadingStaticMeshIds[staticMeshId] = staticMeshId;

        engine.resourceLoader.loadJsonResource('static-mesh', staticMeshId, function (staticMesh) {

            if (staticMesh == null) {

                self.failedStaticMeshIds[staticMeshId] = true;

            } else {

                self.initStaticMesh(staticMesh, options);

                self.staticMeshesById[staticMeshId] = staticMesh;
            }

            delete self.loadingStaticMeshIds[staticMeshId];

            callback(staticMesh);
        });
    }

    this.getStaticMesh = function (staticMeshId) {

        if (staticMeshId == null) {
            return null;
        }

        return this.staticMeshesById[staticMeshId];
    }

    this.initStaticMesh = function (staticMesh, options) {

        if (options.buildRotationSafeBoundingSphere) {
            engine.staticMeshMathHelper.buildStaticMeshRotationSafeBoundingSphereRadius(staticMesh);
        }

        if (options.buildChunkAABBs) {
            engine.staticMeshMathHelper.buildStaticMeshChunkAABBs(staticMesh);
        }

        if (options.buildChunkCollisionFaces) {
            engine.staticMeshMathHelper.buildStaticMeshChunkCollisionFaces(staticMesh);
        }

        if (options.findPointCompletelyOutsideOfExtremities) {
            engine.staticMeshMathHelper.findStaticMeshPointCompletelyOutsideOfExtremities(staticMesh);
        }

        staticMesh.buffers = {
            vertexBuffer: gl.createBuffer(),
            normalsBuffer: gl.createBuffer(),
            tangentsBuffer: gl.createBuffer(),
            bitangentsBuffer: gl.createBuffer(),
            texCoordBuffer: gl.createBuffer(),
            indexBuffer: gl.createBuffer()
        };

        gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticMesh.verts), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.normalsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticMesh.normals), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.tangentsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticMesh.tangents), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.bitangentsBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticMesh.bitangents), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(staticMesh.uvs), gl.STATIC_DRAW);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, staticMesh.buffers.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(staticMesh.indecies), gl.STATIC_DRAW);

        delete staticMesh.verts;
        delete staticMesh.normals;
        delete staticMesh.tangents;
        delete staticMesh.bitangents;
        delete staticMesh.uvs;
        delete staticMesh.indecies;
    }

    this.cleanUp = function () {

        this.log('Cleaning up...');

        for (var staticMeshId in this.staticMeshesById) {

            var staticMesh = this.staticMeshesById[staticMeshId];

            this.cleanUpStaticMeshBuffers(staticMesh)
        }

        this.staticMeshesById = {};

        this.log('... done.')
    }

    this.cleanUpStaticMeshBuffers = function (staticMesh) {

        for (var bufferName in staticMesh.buffers) {

            var buffer = staticMesh.buffers[bufferName];

            if (buffer != null) {
                gl.deleteBuffer(buffer);
            }
        }
    }

    this.log = function (message) {

        console.log('Static Mesh Manager: ' + message);
    }
}