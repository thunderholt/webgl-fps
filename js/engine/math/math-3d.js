function Math3D() {

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

    this.buildAABBFromPoints = function (points) {

        var from = null;
        var to = null;

        for (var i = 0; i < points.length; i++) {
            var point = points[i];

            if (from == null) {
                from = vec3.clone(point);
            } else if (point[0] < from[0]) {
                from[0] = point[0];
            } else if (point[1] < from[1]) {
                from[1] = point[1];
            } else if (point[2] > from[2]) {
                from[2] = point[2];
            }

            if (to == null) {
                to = vec3.clone(point);
            } else if (point[0] > to[0]) {
                to[0] = point[0];
            } else if (point[1] > to[1]) {
                to[1] = point[1];
            } else if (point[2] < to[2]) {
                to[2] = point[2];
            }
        }

        var aabb = {
            from: from,
            to: to
        }

        return aabb;
    }

    this.buildAABBPoints = function (aabb) {

        var points = [
            [aabb.from[0], aabb.from[1], aabb.from[2]],
            [aabb.to[0], aabb.from[1], aabb.from[2]],
            [aabb.from[0], aabb.to[1], aabb.from[2]],
            [aabb.to[0], aabb.to[1], aabb.from[2]],
            [aabb.from[0], aabb.from[1], aabb.to[2]],
            [aabb.to[0], aabb.from[1], aabb.to[2]],
            [aabb.from[0], aabb.to[1], aabb.to[2]],
            [aabb.to[0], aabb.to[1], aabb.to[2]]
        ];

        return points;
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

    /*this.buildRotationSafeAABBFromPoints = function (points) {

        var extreme = vec3.create();

        for (var i = 0; i < points.length; i++) {
            var point = points[i];

            var x = Math.abs(point[0]);
            var y = Math.abs(point[1]);
            var z = -Math.abs(point[2]);

            if (x > extreme[0]) {
                extreme[0] = x;
            }

            if (y > extreme[1]) {
                extreme[1] = y;
            }

            if (z < extreme[2]) {
                extreme[2] = z;
            }
        }

        var from = vec3.create();
        vec3.scale(from, extreme, -1);

        var aabb = {
            from: from,
            to: extreme
        }

        return aabb;
    }*/

    this.calculateAABBSize = function (aabb) {

        return [aabb.to[0] - aabb.from[0], aabb.to[1] - aabb.from[1], aabb.from[2] - aabb.to[2]];
    }

    this.cloneAABB = function (aabb) {

        return new AABB(vec3.clone(aabb.from), vec3.clone(aabb.to));
    }

    this.translateAABB = function (aabb, amount) {

        vec3.add(aabb.from, aabb.from, amount);
        vec3.add(aabb.to, aabb.to, amount);
    }

    this.clampPointToAABB = function (point, aabb) {

        var clampedPoint = vec3.clone(point);

        if (point[0] < aabb.from[0]) {
            clampedPoint[0] = aabb.from[0];
        }

        if (point[1] < aabb.from[1]) {
            clampedPoint[1] = aabb.from[1];
        }

        if (point[2] > aabb.from[2]) {
            clampedPoint[2] = aabb.from[2];
        }

        if (point[0] > aabb.to[0]) {
            clampedPoint[0] = aabb.to[0];
        }

        if (point[1] > aabb.to[1]) {
            clampedPoint[1] = aabb.to[1];
        }

        if (point[2] < aabb.to[2]) {
            clampedPoint[2] = aabb.to[2];
        }

        return clampedPoint;
    }

    this.checkSphereIntersectsAABB = function (sphere, aabb) {

        var nearestPointInAABB = this.clampPointToAABB(sphere.position, aabb);

        var nearestPointInAABBToSpherePosition = [0, 0, 0];
        vec3.sub(nearestPointInAABBToSpherePosition, sphere.position, nearestPointInAABB);

        var sphereRadiusSqr = sphere.radius * sphere.radius;
        var nearestPointInAABBToSpherePositionLengthSqr = vec3.sqrLen(nearestPointInAABBToSpherePosition);

        return nearestPointInAABBToSpherePositionLengthSqr <= sphereRadiusSqr;
    }

    this.checkSphereIntersectsSphere = function (sphere1, sphere2) {

        var sphere1ToSphere2 = vec3.create();
        vec3.subtract(sphere1ToSphere2, sphere2.position, sphere1.position);
        
        var distanceBetweenSpheres = vec3.length(sphere1ToSphere2);

        return distanceBetweenSpheres <= sphere1.radius + sphere2.radius;
    }

    this.calculateSphereCollisionWithPlane = function (sphere, plane, movementDirection) {

        var currentDistanceToPlane = this.calculatePointDistanceFromPlane(plane, sphere.position);
        if (currentDistanceToPlane < sphere.radius) {
            return null;
        }

        var sphereMovementRay = new Ray(
            vec3.clone(sphere.position),
            vec3.clone(movementDirection));

        var sphereMovementRayPlaneIntersection = this.calculateRayIntersectionWithPlane(sphereMovementRay, plane);
        if (sphereMovementRayPlaneIntersection == null) {
            return null;
        }

        var invPlaneNormal = [0, 0, 0];
        vec3.scale(invPlaneNormal, plane.normal, -1);

        var cosA = vec3.dot(sphereMovementRay.normal, invPlaneNormal);

        if (cosA == 1) {
            return sphereMovementRayPlaneIntersection;
        }

        var hypotenuse = sphere.radius / cosA;

        var spherePositionToSphereMovementRayPlaneIntersection = [0, 0, 0];
        vec3.sub(spherePositionToSphereMovementRayPlaneIntersection, sphereMovementRayPlaneIntersection, sphere.position);

        var t = vec3.length(spherePositionToSphereMovementRayPlaneIntersection) - hypotenuse;

        var spherePlaneIntersection = [0, 0, 0];
        vec3.scale(spherePlaneIntersection, sphereMovementRay.normal, t);
        vec3.add(spherePlaneIntersection, spherePlaneIntersection, sphere.position);
        vec3.scaleAndAdd(spherePlaneIntersection, spherePlaneIntersection, invPlaneNormal, sphere.radius);

        return spherePlaneIntersection;
    }

    this.calculateRayIntersectionWithPlaneDistance = function (ray, plane) {

        /*
		O = Ray origin
		N = ray normal
		t = distance along ray
		P = intersection point
		S = plane normal
		d = plane d

		* Equation 1: Using P and values from the ray:
		O + Nt = P

		* Equation 2: Using P and values from the plane:
		P.S + d = 0

		* Substitute P from equation 1 into equation 2:
		(O + Nt).S + d = 0

		* We need to extract t, so use the dot product distributive law to get it out of the bracketed bit.
		O.S + Nt.S + d = 0
	
		* Extract t from the dot product:
		O.S + t(N.S) + d = 0

		* Rearrange to get t on the left hand side
		1) -t(N.S) = O.S + d
		2) -t = (O.S + d) / N.S
		3) t = -((O.S + d) / N.S)
		*/

        var nDotS = vec3.dot(ray.normal, plane.normal);

        if (nDotS == 0) {
            return null;
        }

        var t = -((vec3.dot(ray.origin, plane.normal) + plane.d) / nDotS);

        return t;
    }

    this.calculateRayIntersectionWithPlane = function (ray, plane) {

        var t = this.calculateRayIntersectionWithPlaneDistance(ray, plane);

        if (t == null || t < 0) {
            return null;
        }

        // Compute the intersection.
        var intersection = vec3.create();
        vec3.scaleAndAdd(intersection, ray.origin, ray.normal, t);

        // We're done!
        return intersection;
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

    this.buildPlaneFromPoints = function (points) {

        var vecA = vec3.create();
        var vecB = vec3.create();
        vec3.subtract(vecA, points[1], points[0]);
        vec3.subtract(vecB, points[2], points[0]);

        var normal = vec3.create();
        vec3.cross(normal, vecA, vecB);
        vec3.normalize(normal, normal);

        var d = -vec3.dot(normal, points[0]);

        var plane = new Plane(normal, d);

        return plane;
    }

    this.buildPlaneFromNormalAndPoint = function (normal, point) {

        return new Plane(normal, -vec3.dot(normal, point));
    }

    this.calculatePointDistanceFromPlane = function (plane, point) {

        var distance = vec3.dot(plane.normal, point) + plane.d;

        return distance;
    }

    this.buildFrustumFromViewProjMatrix = function (viewProjMatrix) {

        var invViewProjMatrix = mat4.create();
        mat4.invert(invViewProjMatrix, viewProjMatrix);

        var triangles = [];

        triangles[FrustumPlane.Near] = [
            [-1, 1, -1, 1],
            [-1, -1, -1, 1],
            [1, 1, -1, 1]
        ];

        triangles[FrustumPlane.Far] = [
			[-1, 1, 1, 1],
			[1, 1, 1, 1],
			[-1, -1, 1, 1]
        ];

        triangles[FrustumPlane.Left] = [
            [-1, 1, 1, 1],
            [-1, -1, 1, 1],
            [-1, 1, -1, 1]
        ];

        triangles[FrustumPlane.Right] = [
            [1, 1, -1, 1],
            [1, -1, -1, 1],
            [1, 1, 1, 1]
        ];

        triangles[FrustumPlane.Top] = [
           [-1, 1, 1, 1],
           [-1, 1, -1, 1],
           [1, 1, 1, 1]
        ];

        triangles[FrustumPlane.Bottom] = [
           [-1, -1, -1, 1],
           [-1, -1, 1, 1],
           [1, -1, 1, 1]
        ];

        var planes = [];

        for (var triangleIndex = 0; triangleIndex < triangles.length; triangleIndex++) {

            var triangle = triangles[triangleIndex];

            var transformedPoints = [];

            for (var i = 0; i < triangle.length; i++) {
                var point = triangle[i];

                var tempPoint = vec4.create();
                vec4.transformMat4(tempPoint, point, invViewProjMatrix);

                var transformedPoint = [tempPoint[0] / tempPoint[3], tempPoint[1] / tempPoint[3], tempPoint[2] / tempPoint[3]];
                transformedPoints.push(transformedPoint);
            }

            var plane = this.buildPlaneFromPoints(transformedPoints);

            planes.push(plane);
        }

        var frustum = new Frustum(planes);

        return frustum;
    }

    this.checkFrustumIntersectsAABB = function (frustum, aabb) {

        var intersects = true;

        var aabbPoints = this.buildAABBPoints(aabb);

        for (var planeIndex = 0; planeIndex < frustum.planes.length; planeIndex++) {

            var plane = frustum.planes[planeIndex];

            var allPointsAreInfrontOfPlane = true;

            for (var pointIndex = 0; pointIndex < aabbPoints.length; pointIndex++) {

                var point = aabbPoints[pointIndex];

                var pointDistanceFromPlane = this.calculatePointDistanceFromPlane(plane, point);

                if (pointDistanceFromPlane <= 0) {
                    allPointsAreInfrontOfPlane = false;
                    break;
                }
            }

            if (allPointsAreInfrontOfPlane) {
                intersects = false;
                break;
            }
        }

        return intersects;
    }

    this.checkFrustumIntersectsSphere = function (frustum, sphere) {

        var intersects = true;

        for (var planeIndex = 0; planeIndex < frustum.planes.length; planeIndex++) {

            var plane = frustum.planes[planeIndex];

            var spherePositionDistanceFromPlane = this.calculatePointDistanceFromPlane(plane, sphere.position);

            if (spherePositionDistanceFromPlane > sphere.radius) {
                intersects = false;
                break;
            }
        }

        return intersects;
    }

    this.concatenateMatricesToSingleArray = function (matrices) {

        var array = [];

        for (var i = 0; i < matrices.length; i++) {
            var matrix = matrices[i];

            for (var j = 0; j < matrix.length; j++) {
                array.push(matrix[j]);
            }
        }

        return array;
    }
}