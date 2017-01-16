function MathFrustum() {

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

        var $ = this.$checkFrustumIntersectsAABB;

        var intersects = true;

        this.buildAABBPoints($.aabbPoints, aabb);

        for (var planeIndex = 0; planeIndex < frustum.planes.length; planeIndex++) {

            var plane = frustum.planes[planeIndex];

            var allPointsAreInfrontOfPlane = true;

            for (var pointIndex = 0; pointIndex < $.aabbPoints.length; pointIndex++) {

                var point = $.aabbPoints[pointIndex];

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

    // Function locals.
    this.$checkFrustumIntersectsAABB = {
        aabbPoints: [
            vec3.create(), vec3.create(), vec3.create(), vec3.create(),
            vec3.create(), vec3.create(), vec3.create(), vec3.create()]
    }
}