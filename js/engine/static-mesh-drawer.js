/*function StaticMeshDrawer(engine) {

    var gl = null;

    this.effect = null;

    this.init = function (callback) {

        gl = engine.glManager.gl;

        callback();
    }

    this.renderStaticMesh = function (staticMesh, renderingParameters, options) {

        // Check the parameters.
        if (staticMesh == null) {
            throw "Static mesh is null!";
        }

        if (options.staticMeshRenderState == null && options.staticMeshChunkRenderStates == null) {
            throw "We can't render a static mesh without render states!";
        }

        // Resolve the appropriate effect for the supplied rendering parameters.
        var effect = null;

        if (renderingParameters.mode == 'main-render') {

            this.prepareForMainRender();

        } else if (renderingParameters.mode == 'shadow-map-build') {

            this.prepareForShadowMapBuild();
        }

        // Build the translation matrix.
        var translationMatrix = mat4.create();

        if (options.position != null) {
            mat4.translate(translationMatrix, translationMatrix, options.position);
        }

        // Build the rotation matrix.
        var rotationMatrix = mat4.create();

        if (options.rotation != null) {
            mat4.rotateX(rotationMatrix, rotationMatrix, options.rotation[0]);
            mat4.rotateY(rotationMatrix, rotationMatrix, options.rotation[1]);
            mat4.rotateZ(rotationMatrix, rotationMatrix, options.rotation[2]);
        }

        // Build the world matrix.
        var worldMatrix = mat4.create();

        mat4.multiply(worldMatrix, translationMatrix, rotationMatrix);

        gl.uniformMatrix4fv(this.effect.uniforms.rotationMatrix, false, rotationMatrix);
        gl.uniformMatrix4fv(this.effect.uniforms.worldMatrix, false, worldMatrix);
        gl.uniformMatrix4fv(this.effect.uniforms.viewProjMatrix, false, renderingParameters.viewProjMatrix);

        // Bind the static mesh's buffers to the effect.
        this.bindStaticMeshBuffersToEffect(staticMesh);

        // Render the chunks.
        for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

            var chunk = staticMesh.chunks[chunkIndex];

            if (renderingParameters.mode == 'main-render') {

                this.prepareChunkForMainRender(chunk, chunkIndex, options);
            }

            gl.drawElements(gl.TRIANGLES, chunk.numFaces * 3, gl.UNSIGNED_SHORT, chunk.startIndex * 2);
        }
    }

    this.prepareForMainRender = function (options) {

        this.effect = engine.effectManager.useEffect('static-mesh-main-render');

        gl.enable(gl.DEPTH_TEST);
        gl.depthFunc(gl.LESS);

        gl.enable(gl.CULL_FACE);
        gl.cullFace(gl.BACK);

        gl.disable(gl.BLEND);
    }

    this.prepareForShadowMapBuild = function (options) {

        if (options.isBackPass) {

            this.effect = engine.effectManager.useEffect('static-mesh-shadow-map-build-back-pass');

            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.FRONT);

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            gl.disable(gl.BLEND);

        } else {

            this.effect = engine.effectManager.useEffect('static-mesh-shadow-map-build-front-pass');

            gl.enable(gl.CULL_FACE);
            gl.cullFace(gl.BACK);

            gl.enable(gl.DEPTH_TEST);
            gl.depthFunc(gl.LEQUAL);

            gl.disable(gl.BLEND);

            gl.activeTexture(gl.TEXTURE0);
            gl.bindTexture(gl.TEXTURE_2D, engine.shadowMapManager.buildBuffers.backPassBufferTexture);
        }
    }

    this.prepareChunkForMainRender = function (chunk, chunkIndex, options) {

        // Resolve the effective light IDs, either from the chunk render states (e.g. for the world static mesh) or 
        // from the static mesh render state (for actors ands such like).
        var effectiveLightIds = null;

        if (options.staticMeshChunkRenderStates != null) {

            var chunkRenderState = options.staticMeshChunkRenderStates[chunkIndex];

            if (chunkRenderState == null) {
                throw "Render state not found for chunk.";
            }

            effectiveLightIds = chunkRenderState.effectiveLightIds;

        } else {

            effectiveLightIds = options.staticMeshRenderState.effectiveLightIds;
        }

        var effectiveLights = engine.renderer.gatherLightsFromLightIds(effectiveLightIds);

        var material = engine.renderer.coalesceMaterial(chunk.materialId);

        engine.renderer.prepareStandardMaterial(material, this.effect, effectiveLights, engine.camera);
    }

    this.bindStaticMeshBuffersToEffect = function (staticMesh) {

        // Bind the vertex buffer.
        if (this.effect.attributes.vertexPosition != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.vertexBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexPosition,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexPosition);
        }

        // Bind the normals buffer.
        if (this.effect.attributes.vertexNormal != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.normalsBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexNormal,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexNormal);
        }

        // Bind the tangents buffer.
        if (this.effect.attributes.vertexTangent != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.tangentsBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexTangent,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexTangent);
        }

        // Bind the bitangents buffer.
        if (this.effect.attributes.vertexBitangent != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.bitangentsBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexBitangent,
                3, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexBitangent);
        }

        // Bind the text coord buffer.
        if (this.effect.attributes.vertexTexCoord != null) {
            gl.bindBuffer(gl.ARRAY_BUFFER, staticMesh.buffers.texCoordBuffer);
            gl.vertexAttribPointer(
                this.effect.attributes.vertexTexCoord,
                2, gl.FLOAT, false, 0, 0);
            gl.enableVertexAttribArray(this.effect.attributes.vertexTexCoord);
        }

        // Bind the index buffer.
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, staticMesh.buffers.indexBuffer);
    }
}*/