function LineDrawer(engine) {

    var gl = null;

    this.cubeVertexBuffer = null;
    this.sphereVertexBuffer = null;
    this.numSpherePoints = 0;

    this.init = function (callback) {

        gl = engine.glManager.gl;

        this.initCube();
        this.initSphere();

        callback();
    }

    this.initCube = function () {

        this.cubeVertexBuffer = gl.createBuffer();

        var points = [
			0, 0, 0, 1, 0, 0, // Front bottom
			0, 1, 0, 1, 1, 0, // Front top
			0, 0, 0, 0, 1, 0, // Front left
			1, 0, 0, 1, 1, 0, // Front right
			0, 0, -1, 1, 0, -1, // Back bottom
			0, 1, -1, 1, 1, -1, // Back top
			0, 0, -1, 0, 1, -1, // Back left
			1, 0, -1, 1, 1, -1, // Back right
			0, 0, 0, 0, 0, -1, // Left bottom
			0, 1, 0, 0, 1, -1, // Left top
			1, 0, 0, 1, 0, -1, // Right bottom
			1, 1, 0, 1, 1, -1 // Right top
        ];

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    }

    this.initSphere = function () {

        this.sphereVertexBuffer = gl.createBuffer();

        var points = [];

        var numSegments = 20;
        var numSegmentPoints = 40;
        var segmentRadiansStep = (Math.PI * 2) / numSegments;
        var segmentPointsRadiansStep = (Math.PI * 2) / numSegmentPoints;
        var segmentRadians = 0;

        for (var i = 0; i < numSegments; i++) {

            var segmentDirection = {
                x: Math.cos(segmentRadians),
                z: Math.sin(segmentRadians)
            }

            segmentRadians += segmentRadiansStep;

            var segmentPointsRadians = 0;

            for (var j = 0; j <= numSegmentPoints; j++) {

                var d = Math.sin(segmentPointsRadians);

                points.push(segmentDirection.x * d);
                points.push(Math.cos(segmentPointsRadians));
                points.push(segmentDirection.z * d);

                segmentPointsRadians += segmentPointsRadiansStep;
            }
        }

        this.numSpherePoints = points.length / 3;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereVertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(points), gl.STATIC_DRAW);
    }

    this.drawCube = function (renderingParameters, position, size, colour, enableDepthTest) {

        if (colour == null) {
            colour = [1.0, 0.0, 0.0];
        }

        if (enableDepthTest == null) {
            enableDepthTest = true;
        }

        var effect = engine.effectManager.useEffect('line');

        gl.uniformMatrix4fv(effect.uniforms.viewProjMatrix, false, renderingParameters.viewProjMatrix);
        gl.uniform3fv(effect.uniforms.position, position);
        gl.uniform3fv(effect.uniforms.size, size);
        gl.uniform3fv(effect.uniforms.colour, colour);

        gl.disable(gl.BLEND);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.cubeVertexBuffer);
        gl.vertexAttribPointer(
        	effect.attributes.vertexPosition,
        	3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(effect.attributes.vertexPosition);

        if (enableDepthTest) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        //gl.disable(gl.DEPTH_TEST);
        gl.drawArrays(gl.LINES, 0, 24);
        //gl.enable(gl.DEPTH_TEST);
    }

    this.drawSphere = function (renderingParameters, position, radius, colour, enableDepthTest) {

        if (colour == null) {
            colour = [1.0, 0.0, 0.0];
        }

        var effect = engine.effectManager.useEffect('line');

        gl.uniformMatrix4fv(effect.uniforms.viewProjMatrix, false, renderingParameters.viewProjMatrix);
        gl.uniform3fv(effect.uniforms.position, position);
        gl.uniform3fv(effect.uniforms.size, [radius, radius, radius]);
        gl.uniform3fv(effect.uniforms.colour, colour);

        gl.disable(gl.BLEND);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.sphereVertexBuffer);
        gl.vertexAttribPointer(
        	effect.attributes.vertexPosition,
        	3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(effect.attributes.vertexPosition);

        if (enableDepthTest) {
            gl.enable(gl.DEPTH_TEST);
        } else {
            gl.disable(gl.DEPTH_TEST);
        }

        //gl.disable(gl.DEPTH_TEST);
        gl.drawArrays(gl.LINE_STRIP, 0, this.numSpherePoints);
        //gl.enable(gl.DEPTH_TEST);
    }
}