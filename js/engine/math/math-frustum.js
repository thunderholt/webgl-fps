function MathFrustum() {

    this.buildFrustumFromViewProjMatrix = function (out, viewProjMatrix) {

        var $ = this.$buildFrustumFromViewProjMatrix;

        mat4.invert($.invViewProjMatrix, viewProjMatrix);

        if (!$.trianglesAreInitialised) {

            vec4.set($.triangles[FrustumPlane.Near][0], -1, 1, -1, 1);
            vec4.set($.triangles[FrustumPlane.Near][1], -1, -1, -1, 1);
            vec4.set($.triangles[FrustumPlane.Near][2], 1, 1, -1, 1);

            vec4.set($.triangles[FrustumPlane.Far][0], -1, 1, 1, 1);
            vec4.set($.triangles[FrustumPlane.Far][1], 1, 1, 1, 1);
            vec4.set($.triangles[FrustumPlane.Far][2], -1, -1, 1, 1);

            vec4.set($.triangles[FrustumPlane.Left][0], -1, 1, 1, 1);
            vec4.set($.triangles[FrustumPlane.Left][1], -1, -1, 1, 1);
            vec4.set($.triangles[FrustumPlane.Left][2], -1, 1, -1, 1);

            vec4.set($.triangles[FrustumPlane.Right][0], 1, 1, -1, 1);
            vec4.set($.triangles[FrustumPlane.Right][1], 1, -1, -1, 1);
            vec4.set($.triangles[FrustumPlane.Right][2], 1, 1, 1, 1);

            vec4.set($.triangles[FrustumPlane.Top][0], -1, 1, 1, 1);
            vec4.set($.triangles[FrustumPlane.Top][1], -1, 1, -1, 1);
            vec4.set($.triangles[FrustumPlane.Top][2], 1, 1, 1, 1);

            vec4.set($.triangles[FrustumPlane.Bottom][0], -1, -1, -1, 1);
            vec4.set($.triangles[FrustumPlane.Bottom][1], -1, -1, 1, 1);
            vec4.set($.triangles[FrustumPlane.Bottom][2], 1, -1, 1, 1);

            $.trianglesAreInitialised = true;
        }

        for (var triangleIndex = 0; triangleIndex < $.triangles.length; triangleIndex++) {

            var triangle = $.triangles[triangleIndex];

            for (var i = 0; i < triangle.length; i++) {
                var point = triangle[i];
                vec4.transformMat4($.tempPoint, point, $.invViewProjMatrix);
                vec4.set($.transformedPoints[i], $.tempPoint[0] / $.tempPoint[3], $.tempPoint[1] / $.tempPoint[3], $.tempPoint[2] / $.tempPoint[3]);
            }

            this.buildPlaneFromPoints(out.planes[triangleIndex], $.transformedPoints);
        }
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

    this.$buildFrustumFromViewProjMatrix = {
        invViewProjMatrix: mat4.create(),
        triangles: [
            [vec4.create(), vec4.create(), vec4.create()],
            [vec4.create(), vec4.create(), vec4.create()],
            [vec4.create(), vec4.create(), vec4.create()],
            [vec4.create(), vec4.create(), vec4.create()],
            [vec4.create(), vec4.create(), vec4.create()],
            [vec4.create(), vec4.create(), vec4.create()]
        ],
        trianglesAreInitialised: false,
        transformedPoints: [vec4.create(), vec4.create(), vec4.create()],
        tempPoint: vec4.create()
    }
}