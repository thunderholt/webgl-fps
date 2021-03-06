﻿function Math3D() {

    this.zeroVec3 = vec3.create();
    this.zeroVec4 = vec4.create();

    this.downVec3 = vec3.create(); // TODO - get rid - use axes.
    vec3.set(this.downVec3, 0, -1, 0);

    this.identityMat4 = mat4.create();
    mat4.identity(this.identityMat4);

    this.axes3D = {
        positiveX: vec3.create(),
        negativeX: vec3.create(),
        positiveY: vec3.create(),
        negativeY: vec3.create(),
        positiveZ: vec3.create(),
        negativeZ: vec3.create()
    }

    vec3.set(this.axes3D.positiveX, 1, 0, 0);
    vec3.set(this.axes3D.negativeX, -1, 0, 0);
    vec3.set(this.axes3D.positiveY, 0, 1, 0);
    vec3.set(this.axes3D.negativeY, 0, -1, 0);
    vec3.set(this.axes3D.positiveZ, 0, 0, 1);
    vec3.set(this.axes3D.negativeZ, 0, 0, -1);

    this.clamp = function (value, min, max) {

        if (value < min) {
            return min;
        } else if (value > max) {
            return max;
        } else {
            return value;
        }
    }

    this.calculateLerpFactor = function (from, to, value) {

        return this.clamp((value - from) / (to - from), 0.0, 1.0);
    }

    this.lerp = function (from, to, lerpFactor) {

        return from + ((to - from) * lerpFactor);
    }

    this.buildAxesFromRotations = function (out, rotations) {

        var $ = this.$buildAxesFromRotations;

        vec3.set(out.xAxis, 1, 0, 0);
        vec3.set(out.yAxis, 0, 1, 0);
        vec3.set(out.zAxis, 0, 0, -1);

        mat4.identity($.rotationMatrix);
        mat4.rotateZ($.rotationMatrix, $.rotationMatrix, rotations[2]);
        mat4.rotateY($.rotationMatrix, $.rotationMatrix, rotations[1]);
        mat4.rotateX($.rotationMatrix, $.rotationMatrix, rotations[0]);

        vec3.transformMat4(out.xAxis, out.xAxis, $.rotationMatrix);
        vec3.transformMat4(out.yAxis, out.yAxis, $.rotationMatrix);
        vec3.transformMat4(out.zAxis, out.zAxis, $.rotationMatrix);

        /*var xRotationMatrix = mat4.create();
        mat4.rotateX(xRotationMatrix, xRotationMatrix, rotations[0]);

        var yRotationMatrix = mat4.create();
        mat4.rotateY(yRotationMatrix, yRotationMatrix, rotations[1]);

        var zRotationMatrix = mat4.create();
        mat4.rotateZ(zRotationMatrix, zRotationMatrix, rotations[2]);

        var lookRotationMatrix = mat4.create();
        mat4.multiply(lookRotationMatrix, zRotationMatrix, yRotationMatrix);
        mat4.multiply(lookRotationMatrix, lookRotationMatrix, xRotationMatrix);

        vec3.transformMat4(out.xAxis, out.xAxis, lookRotationMatrix);
        vec3.transformMat4(out.yAxis, out.yAxis, lookRotationMatrix);
        vec3.transformMat4(out.zAxis, out.zAxis, lookRotationMatrix);*/
    }

    this.buildMovementNormalFromAxes = function (out, movementAxes, movementAxisMultipliers) {

        vec3.set(out, 0, 0, 0);
        vec3.scaleAndAdd(out, out, movementAxes.xAxis, movementAxisMultipliers[0]);
        vec3.scaleAndAdd(out, out, movementAxes.yAxis, movementAxisMultipliers[1]);
        vec3.scaleAndAdd(out, out, movementAxes.zAxis, movementAxisMultipliers[2]);
        vec3.normalize(out, out);
    }

    this.buildBoundingSphereRadiusAtOriginFromPoints = function (points) {

        var radius = 0;

        for (var i = 0; i < points.length; i++) {
            var point = points[i];

            var length = vec3.length(point);

            if (length > radius) {
                radius = length;
            }
        }

        return radius;
    }

    this.calculateTangentSpaceVectors = function(v0, v1, v2, normal, uv0, uv1, uv2) {

        var edge1 = vec3.create();
        vec3.subtract(edge1, v1, v0);

        var edge2 = vec3.create();
        vec3.subtract(edge2, v2, v0);
		
        var deltaUV1 = vec3.create();
        vec2.subtract(deltaUV1, uv1, uv0);

        var deltaUV2 = vec3.create();
        vec2.subtract(deltaUV2, uv2, uv0);

        var f = 1.0 / (deltaUV1[0] * deltaUV2[1] - deltaUV2[0] * deltaUV1[1]);

        var tangent = vec3.create();

        tangent[0] = f * (deltaUV2[1] * edge1[0] - deltaUV1[1] * edge2[0]);
        tangent[1] = f * (deltaUV2[1] * edge1[1] - deltaUV1[1] * edge2[1]);
        tangent[2] = f * (deltaUV2[1] * edge1[2] - deltaUV1[1] * edge2[2]);

        vec3.normalize(tangent, tangent);

        var bitangent = vec3.create();
        vec3.cross(bitangent, tangent, normal);
        vec3.scale(bitangent, bitangent, -1);
	    
        vec3.cross(tangent, bitangent, normal);

        var result = {
            tangent: tangent,
            bitangent: bitangent
        }

        return result;
    }

    this.concatenateMatricesToSingleArray = function (out, matrices) {

        var outIndex = 0;

        for (var i = 0; i < matrices.length; i++) {
            var matrix = matrices[i];

            for (var j = 0; j < matrix.length; j++) {
                out[outIndex++] = matrix[j];
            }
        }
    }

    this.buildWorldMatrix = function (out, position, rotation) {

        mat4.translate(out, this.identityMat4, position);
        mat4.rotateX(out, out, rotation[0]);
        mat4.rotateY(out, out, rotation[1]);
        mat4.rotateZ(out, out, rotation[2]);
    }
    
    this.calculateYAxisFacingAngle = function (from, to) {

        var targetAngle = Math.atan2(
           to[0] - from[0],
           to[2] - from[2]);

        return targetAngle;
    }

    this.rotateTowardsTargetAngle = function (currentAngle, targetAngle, maxDelta) {
     
        // TODO - fix twirly problem.

        if (currentAngle > targetAngle) {
            currentAngle -= maxDelta;
            currentAngle = Math.max(currentAngle, targetAngle);
        } else if (currentAngle < targetAngle) {
            currentAngle += maxDelta;
            currentAngle = Math.min(currentAngle, targetAngle);
        }

        return currentAngle;
    }

    util.copyObjectPropertiesToOtherObject(new MathAABB(), this);
    util.copyObjectPropertiesToOtherObject(new MathSphere(), this);
    util.copyObjectPropertiesToOtherObject(new MathRay(), this);
    util.copyObjectPropertiesToOtherObject(new MathPlane(), this);
    util.copyObjectPropertiesToOtherObject(new MathFrustum(), this);
    util.copyObjectPropertiesToOtherObject(new MathCollisionFace(), this);
    util.copyObjectPropertiesToOtherObject(new MathCollisionLine(), this);

    // Function locals.
    this.$buildAxesFromRotations = {
        rotationMatrix: mat4.create()
    }
}