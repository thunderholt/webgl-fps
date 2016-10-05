function UnitTests() {

    function assert(condition) {

        if (!condition) {
            throw 'Test condition is false.';
        }
    }

    function areNearlyEqual(v1, v2) {

        var epsilon = 0.005;
        return (v1 > (v2 - epsilon)) && (v1 < (v2 + epsilon));
    }

    this.run = function () {

        for (var testName in this.tests) {
            var test = this.tests[testName];

            console.log('Running test "' + testName + '".');

            test();
        }
    }

    this.tests = {

        'Math3D.buildPlaneFromPoints.lookingUpX.1': function () {

            var points = [
				[0, 1, 0],
				[0, 0, 1],
				[0, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == 1);
            assert(plane.normal[1] == 0);
            assert(plane.normal[2] == 0);
            assert(plane.d == 0);
        },

        'Math3D.buildPlaneFromPoints.lookingUpX.2': function () {

            var points = [
				[1, 1, 0],
				[1, 0, 1],
				[1, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == 1);
            assert(plane.normal[1] == 0);
            assert(plane.normal[2] == 0);
            assert(plane.d == -1);
        },

        'Math3D.buildPlaneFromPoints.lookingUpX.3': function () {

            var points = [
				[-1, 1, 0],
				[-1, 0, 1],
				[-1, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == 1);
            assert(plane.normal[1] == 0);
            assert(plane.normal[2] == 0);
            assert(plane.d == 1);
        },

        'Math3D.buildPlaneFromPoints.lookingDownX': function () {

            var points = [
				[0, 1, 0],
				[0, 0, 0],
				[0, 0, 1]
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == -1);
            assert(plane.normal[1] == 0);
            assert(plane.normal[2] == 0);
            assert(plane.d == 0);
        },

        'Math3D.buildPlaneFromPoints.lookingUpY': function () {

            var points = [
				[-1, -10, 0],
				[-1, -10, 1],
				[1, -10, 0]
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == 0);
            assert(plane.normal[1] == 1);
            assert(plane.normal[2] == 0);
            assert(plane.d == 10);
        },

        'Math3D.buildPlaneFromPoints.lookingDownY': function () {

            var points = [
				[-1, -10, 0],
				[1, -10, 0],
				[-1, -10, 1],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == 0);
            assert(plane.normal[1] == -1);
            assert(plane.normal[2] == 0);
            assert(plane.d == -10);
        },

        'Math3D.buildPlaneFromPoints.lookingUpZ': function () {

            var points = [
				[0, 1, 1],
				[0, 0, 1],
				[1, 0, 1]
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == 0);
            assert(plane.normal[1] == 0);
            assert(plane.normal[2] == 1);
            assert(plane.d == -1);
        },

        'Math3D.buildPlaneFromPoints.lookingDownZ': function () {

            var points = [
				[0, 1, 1],
				[1, 0, 1],
				[0, 0, 1]
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            assert(plane.normal[0] == 0);
            assert(plane.normal[1] == 0);
            assert(plane.normal[2] == -1);
            assert(plane.d == 1);
        },

        'Math3D.calculatePointDistanceFromPlane.lookingUpX.onPlane': function () {

            var points = [
				[0, 1, 0],
				[0, 0, 1],
				[0, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            var point = [0, 0, 0];
            var distance = math3D.calculatePointDistanceFromPlane(plane, point);
            assert(distance == 0);
        },

        'Math3D.calculatePointDistanceFromPlane.lookingUpX.infrontOfPlane.1': function () {

            var points = [
				[0, 1, 0],
				[0, 0, 1],
				[0, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            var point = [1.5, 0, 0];
            var distance = math3D.calculatePointDistanceFromPlane(plane, point);
            assert(distance == 1.5);
        },

        'Math3D.calculatePointDistanceFromPlane.lookingUpX.infrontOfPlane.2': function () {

            var points = [
				[1, 1, 0],
				[1, 0, 1],
				[1, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            var point = [1.5, 0, 0];
            var distance = math3D.calculatePointDistanceFromPlane(plane, point);
            assert(distance == 0.5);
        },

        'Math3D.calculatePointDistanceFromPlane.lookingUpX.behindPlane.1': function () {

            var points = [
				[0, 1, 0],
				[0, 0, 1],
				[0, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            var point = [-3.7, 0, 0];
            var distance = math3D.calculatePointDistanceFromPlane(plane, point);
            assert(distance == -3.7);
        },

        'Math3D.calculatePointDistanceFromPlane.lookingUpX.behindPlane.2': function () {

            var points = [
				[-2, 1, 0],
				[-2, 0, 1],
				[-2, 0, 0],
            ];

            var plane = math3D.buildPlaneFromPoints(points);

            var point = [-3, 0, 0];
            var distance = math3D.calculatePointDistanceFromPlane(plane, point);
            assert(distance == -1);
        },

        'Math3D.buildFrustumFromViewProjMatrix': function () {

            var viewMatrix = mat4.create();
            mat4.lookAt(viewMatrix, [0, 0, 0], [0, 0, -1], [0, 1, 0]);

            var projMatrix = mat4.create();
            mat4.perspective(projMatrix, Math.PI / 2, 1, 10, 1000);

            var viewProjMatrix = mat4.create();
            mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

            var frustum = math3D.buildFrustumFromViewProjMatrix(viewProjMatrix);

            // Near plane tests.
            var distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Near], [0, 0, -9]);
            assert(areNearlyEqual(distance, 1));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Near], [0, 0, -11]);
            assert(areNearlyEqual(distance, -1));

            // Far plane tests.
            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Far], [0, 0, -999]);
            assert(areNearlyEqual(distance, -1));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Far], [0, 0, -1001]);
            assert(areNearlyEqual(distance, 1));

            // Left plane tests.
            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Left], [-0.51, 0, -0.5]);
            assert(areNearlyEqual(distance, 0.007));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Left], [-0.5, 0, -0.5]);
            assert(areNearlyEqual(distance, 0));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Left], [-0.5, 0, -0.51]);
            assert(areNearlyEqual(distance, -0.007));

            // Right plane tests.
            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Right], [0.51, 0, -0.5]);
            assert(areNearlyEqual(distance, 0.007));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Right], [0.5, 0, -0.5]);
            assert(areNearlyEqual(distance, 0));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Right], [0.5, 0, -0.51]);
            assert(areNearlyEqual(distance, -0.007));

            // Top plane tests.
            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Top], [0, 0.51, -0.5]);
            assert(areNearlyEqual(distance, 0.007));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Top], [0, 0.5, -0.5]);
            assert(areNearlyEqual(distance, 0));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Top], [0, 0.5, -0.51]);
            assert(areNearlyEqual(distance, -0.007));

            // Bottom plane tests.
            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Bottom], [0, -0.51, -0.5]);
            assert(areNearlyEqual(distance, 0.007));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Bottom], [0, -0.5, -0.5]);
            assert(areNearlyEqual(distance, 0));

            distance = math3D.calculatePointDistanceFromPlane(frustum.planes[FrustumPlane.Bottom], [0, -0.5, -0.51]);
            assert(areNearlyEqual(distance, -0.007));
        },

        'Math3D.checkFrustumIntersectsAABB': function () {

            var viewMatrix = mat4.create();
            mat4.lookAt(viewMatrix, [0, 0, 0], [0, 0, -1], [0, 1, 0]);

            var projMatrix = mat4.create();
            mat4.perspective(projMatrix, Math.PI / 2, 1, 0.1, 1000);

            var viewProjMatrix = mat4.create();
            mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

            var frustum = math3D.buildFrustumFromViewProjMatrix(viewProjMatrix);

            // Left plane tests.
            var aabb = new AABB([-1, 0, -0.2], [-0.51, 1, -0.5]);
            var intersects = math3D.checkFrustumIntersectsAABB(frustum, aabb);
            assert(!intersects);

            aabb = new AABB([-1, 0, -0.2], [-0.49, 1, -0.51]);
            intersects = math3D.checkFrustumIntersectsAABB(frustum, aabb);
            assert(intersects);

            // Right plane tests.
            aabb = new AABB([0.51, 1, -0.2], [1, 0, -0.5]);
            intersects = math3D.checkFrustumIntersectsAABB(frustum, aabb);
            assert(!intersects);

            aabb = new AABB([0.49, 1, -0.2], [1, 0, -0.5]);
            intersects = math3D.checkFrustumIntersectsAABB(frustum, aabb);
            assert(intersects);
        },

        'Math3D.calculateSphereCollisionWithPlane.angledPlane': function () {

            var planeNormal = [-1, 1, 0];
            vec3.normalize(planeNormal, planeNormal);

            var plane = math3D.buildPlaneFromNormalAndPoint(planeNormal, [2, 0, 0]);

            var sphere = new Sphere([1, 2, 0], 1);

            // Check 1.
            var result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [1, 0, 0]);

            assert(areNearlyEqual(result[0], 3.29289));
            assert(areNearlyEqual(result[1], 1.29289));
            assert(result[2] == 0);

            // Check 2.
            result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [-1, 0, 0]);

            assert(result == null);

            // Check 3.
            result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [0, 0, 1]);

            assert(result == null);

            // Check 4.
            result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [0, 0, -1]);

            assert(result == null);
        },

        'Math3D.calculateSphereCollisionWithPlane.squareOn': function () {

            var planeNormal = [-1, 0, 0];
            vec3.normalize(planeNormal, planeNormal);

            var plane = math3D.buildPlaneFromNormalAndPoint(planeNormal, [3, 0, 0]);

            var sphere = new Sphere([1, 2, 0], 1);

            // Check 1.
            var result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [1, 0, 0]);

            assert(areNearlyEqual(result[0], 3));
            assert(areNearlyEqual(result[1], 2));
            assert(result[2] == 0);

            // Check 2.
            result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [-1, 0, 0]);

            assert(result == null);

            // Check 3.
            result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [0, 0, 1]);

            assert(result == null);

            // Check 4.
            result = math3D.calculateSphereCollisionWithPlane(sphere, plane, [0, 0, -1]);

            assert(result == null);
        },

        'Math3D.calculateRayIntersectionWithPlane': function () {

            // Check 1.
            var plane = math3D.buildPlaneFromNormalAndPoint([1, 0, 0], [3, 0, 0]);

            var ray = new Ray([10, 5, 3], [-1, 0, 0]);

            var result = math3D.calculateRayIntersectionWithPlane(ray, plane);

            assert(result[0] == 3);
            assert(result[1] == 5);
            assert(result[2] == 3);

            // Check 2.
            var ray = new Ray();
            ray.origin = [2, 5, 3];
            ray.normal = [-1, 0, 0];

            var result = math3D.calculateRayIntersectionWithPlane(ray, plane);

            assert(result == null);
        },
    }
}