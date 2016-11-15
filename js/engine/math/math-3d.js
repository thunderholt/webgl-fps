function Math3D() {

    this.zeroVec3 = vec3.create();
    this.zeroVec4 = vec4.create();

    this.buildAxesFromRotations = function (rotations) {

        var xAxis = [1, 0, 0];
        var yAxis = [0, 1, 0];
        var zAxis = [0, 0, -1];

        var xRotationMatrix = mat4.create();
        mat4.rotateX(xRotationMatrix, xRotationMatrix, rotations[0]);

        var yRotationMatrix = mat4.create();
        mat4.rotateY(yRotationMatrix, yRotationMatrix, rotations[1]);

        var zRotationMatrix = mat4.create();
        mat4.rotateZ(zRotationMatrix, zRotationMatrix, rotations[2]);

        var lookRotationMatrix = mat4.create();
        mat4.multiply(lookRotationMatrix, zRotationMatrix, yRotationMatrix);
        mat4.multiply(lookRotationMatrix, lookRotationMatrix, xRotationMatrix);

        vec3.transformMat4(xAxis, xAxis, lookRotationMatrix);
        vec3.transformMat4(yAxis, yAxis, lookRotationMatrix);
        vec3.transformMat4(zAxis, zAxis, lookRotationMatrix);

        return {
            xAxis: xAxis,
            yAxis: yAxis,
            zAxis: zAxis
        }
    }

    this.buildMovementNormalFromAxes = function (movementAxes, movementAxisMultipliers) {

        var movementNormal = [0, 0, 0];
        vec3.scaleAndAdd(movementNormal, movementNormal, movementAxes.xAxis, movementAxisMultipliers[0]);
        vec3.scaleAndAdd(movementNormal, movementNormal, movementAxes.yAxis, movementAxisMultipliers[1]);
        vec3.scaleAndAdd(movementNormal, movementNormal, movementAxes.zAxis, movementAxisMultipliers[2]);
        vec3.normalize(movementNormal, movementNormal);

        return movementNormal;
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

    
    util.copyObjectPropertiesToOtherObject(new MathAABB(), this);
    util.copyObjectPropertiesToOtherObject(new MathSphere(), this);
    util.copyObjectPropertiesToOtherObject(new MathRay(), this);
    util.copyObjectPropertiesToOtherObject(new MathPlane(), this);
    util.copyObjectPropertiesToOtherObject(new MathFrustum(), this);
    util.copyObjectPropertiesToOtherObject(new MathCollisionFace(), this);
}