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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var plane = new Plane();

            math3D.buildPlaneFromPoints(plane, points);

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

            var frustum = new Frustum();
            math3D.buildFrustumFromViewProjMatrix(frustum, viewProjMatrix);

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

            var frustum = new Frustum();
            math3D.buildFrustumFromViewProjMatrix(frustum, viewProjMatrix);

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
            var result = vec3.create();

            math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [1, 0, 0]);

            assert(areNearlyEqual(result[0], 3.29289));
            assert(areNearlyEqual(result[1], 1.29289));
            assert(result[2] == 0);

            // Check 2.
            assert(!math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [-1, 0, 0]));

            // Check 3.
            assert(!math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [0, 0, 1]));

            // Check 4.
            assert(!math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [0, 0, -1]));
        },

        'Math3D.calculateSphereCollisionWithPlane.squareOn': function () {

            var planeNormal = [-1, 0, 0];
            vec3.normalize(planeNormal, planeNormal);

            var plane = math3D.buildPlaneFromNormalAndPoint(planeNormal, [3, 0, 0]);

            var sphere = new Sphere([1, 2, 0], 1);

            // Check 1.
            var result = vec3.create();

            math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [1, 0, 0]);

            assert(areNearlyEqual(result[0], 3));
            assert(areNearlyEqual(result[1], 2));
            assert(result[2] == 0);

            // Check 2.
            assert(!math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [-1, 0, 0]));

            // Check 3.
            assert(!math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [0, 0, 1]));

            // Check 4.
            assert(!math3D.calculateSphereCollisionWithPlane(result, sphere, plane, [0, 0, -1]));
        },

        'Math3D.calculateSphereCollisionWithCollisionFace.hitTest1': function () {

            // * Sphere is infront of face-plane.
            // * Heading towards face-plane.
            // * Face-plane intersection point is within face.

            var face = math3D.buildCollisionFaceFromPoints([
				[2, 4, 0], [2, 1, 0], [4, 1, 0]
            ]);

            var sphere = new Sphere([3, 2, 10], 1);

            var result = math3D.calculateSphereCollisionWithCollisionFace(sphere, face, [0, 0, -1]);

            assert(result.intersection[0] == 3);
            assert(result.intersection[1] == 2);
            assert(result.intersection[2] == 0);
            assert(result.distance == 9);
        },

        'Math3D.calculateSphereCollisionWithCollisionFace.hitTest2': function () {

            // * Sphere is infront of face-plane.
            // * Heading towards face-plane.
            // * Face-plane intersection point is outside of face.
            // * Sphere/face intersection point is on face edge.

            var face = math3D.buildCollisionFaceFromPoints([
				[2, 4, 0], [2, 1, 0], [4, 1, 0]
            ]);

            var sphere = new Sphere([1.5, 2, 10], 1);

            var result = math3D.calculateSphereCollisionWithCollisionFace(sphere, face, [0, 0, -1]);

            assert(result.intersection[0] == 2);
            assert(result.intersection[1] == 2);
            assert(result.intersection[2] == 0);
            assert(result.distance > 9 && result.distance < 10);
        },

        'Math3D.calculateSphereCollisionWithCollisionFace.hitTest3': function () {

            // * Sphere intersects face-plane.
            // * Heading towards face-plane.
            // * Sphere/face intersection point is on face edge.

            var face = math3D.buildCollisionFaceFromPoints([
				[2, 4, 0], [2, 1, 0], [4, 1, 0]
            ]);

            var sphere = new Sphere([1.5, 2, 0.9], 1);

            var result = math3D.calculateSphereCollisionWithCollisionFace(sphere, face, [0, 0, -1]);

            assert(result.intersection[0] == 2);
            assert(result.intersection[1] == 2);
            assert(result.intersection[2] == 0);
            assert(result.distance > 0 && result.distance < 1);
        },

        "Math3D.calculateRayIntersectionWithSphere": function () {

            // Check 1.
            var sphere = new Sphere([2, 3, -10], 1);

            var ray = new Ray([4, 3, -10], [-1, 0, 0]);

            var result = vec3.create();

            math3D.calculateRayIntersectionWithSphere(result, ray, sphere);

            assert(result[0] == 3);
            assert(result[1] == 3);
            assert(result[2] == -10);

            // Check 2.
            ray.origin = [2, 5, -10];
            ray.normal = [0, -1, 0];

            math3D.calculateRayIntersectionWithSphere(result, ray, sphere);

            assert(result[0] == 2);
            assert(result[1] == 4);
            assert(result[2] == -10);

            // Check 3.
            ray.origin = [2, 3, -8];
            ray.normal = [0, 0, -1];

            math3D.calculateRayIntersectionWithSphere(result, ray, sphere);

            assert(result[0] == 2);
            assert(result[1] == 3);
            assert(result[2] == -9);

            // Check 4.
            ray.origin = [3, 2, -10];
            ray.normal = [1, 0, 0];

            assert(!math3D.calculateRayIntersectionWithSphere(result, ray, sphere));

            // Check 5.
            ray.origin = [2, 3, -10];
            ray.normal = [0, 1, 0];

            math3D.calculateRayIntersectionWithSphere(result, ray, sphere);

            assert(result[0] == 2);
            assert(result[1] == 4);
            assert(result[2] == -10);

            // Check 6.
            ray.origin = [2, 4, -10];
            ray.normal = [0, 1, 0];

            math3D.calculateRayIntersectionWithSphere(result, ray, sphere);

            assert(result[0] == 2);
            assert(result[1] == 4);
            assert(result[2] == -10);
        },

        'Math3D.calculateRayIntersectionWithPlane': function () {

            // Check 1.
            var plane = math3D.buildPlaneFromNormalAndPoint([1, 0, 0], [3, 0, 0]);

            var ray = new Ray([10, 5, 3], [-1, 0, 0]);

            var result = vec3.create();

            math3D.calculateRayIntersectionWithPlane(result, ray, plane);

            assert(result[0] == 3);
            assert(result[1] == 5);
            assert(result[2] == 3);

            // Check 2.
            var ray = new Ray();
            ray.origin = [2, 5, 3];
            ray.normal = [-1, 0, 0];

            assert(!math3D.calculateRayIntersectionWithPlane(result, ray, plane));

            // Check 3.
            var ray = new Ray([0, 5, 3], [1, 0, 0]);

            math3D.calculateRayIntersectionWithPlane(result, ray, plane);

            assert(result[0] == 3);
            assert(result[1] == 5);
            assert(result[2] == 3);
        },

        "Math3D.calculateNearestPointOnRayToOtherPoint": function () {

            // Check 1.
            var ray = new Ray([5, 0, 0], [0, 1, 0]);
            var point = [2, 3, 0];

            var result = vec3.create();

            math3D.calculateNearestPointOnRayToOtherPoint(result, ray, point, 10);

            assert(result[0] == 5);
            assert(result[1] == 3);
            assert(result[2] == 0);

            // Check 2.
            ray = new Ray([5, 0, 0], [0, 1, 0]);
            point = [4, 10, 0];

            math3D.calculateNearestPointOnRayToOtherPoint(result, ray, point, 10);

            assert(result[0] == 5);
            assert(result[1] == 10);
            assert(result[2] == 0);

            // Check 3.
            ray = new Ray([5, 1, 0], [0, 1, 0]);
            point = [4, 0, 0];

            math3D.calculateNearestPointOnRayToOtherPoint(result, ray, point, 10);

            assert(result[0] == 5);
            assert(result[1] == 1);
            assert(result[2] == 0);

            // Check 4.
            ray = new Ray([5, 0, 0], [0, 1, 0]);
            point = [4, 11, 0];

            math3D.calculateNearestPointOnRayToOtherPoint(result, ray, point, 10);

            assert(result[0] == 5);
            assert(result[1] == 10);
            assert(result[2] == 0);

            // Check 4.
            ray = new Ray([5, 0, 0], [0, 1, 0]);
            point = [6, 5, 0];

            math3D.calculateNearestPointOnRayToOtherPoint(result, ray, point, 10);

            assert(result[0] == 5);
            assert(result[1] == 5);
            assert(result[2] == 0);
        },

        'Math3D.buildCollisionFaceFromPoints.facePlaneCheck.lookingUpX': function () {

            var points = [
				[1, 1, 0],
				[1, 0, 1],
				[1, 0, 0],
            ];

            var face = math3D.buildCollisionFaceFromPoints(points);

            var result = math3D.calculatePointDistanceFromPlane(face.facePlane, [2, 0, 0]);

            assert(result == 1);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [3, 0, 0]);

            assert(result == 2);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 0, 0]);

            assert(result == -1);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [-1, 0, 0]);

            assert(result == -2);
        },

        'Math3D.buildCollisionFaceFromPoints.facePlaneCheck.lookingUpY': function () {

            var points = [
				[-1, 1, 0],
				[-1, 1, 1],
				[1, 1, 0]
            ];

            var face = math3D.buildCollisionFaceFromPoints(points);

            var result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 2, 0]);

            assert(result == 1);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 3, 0]);

            assert(result == 2);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 0, 0]);

            assert(result == -1);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, -1, 0]);

            assert(result == -2);
        },

        'Math3D.buildCollisionFaceFromPoints.facePlaneCheck.lookingUpZ': function () {

            var points = [
				[0, 1, 1],
				[0, 0, 1],
				[1, 0, 1]
            ];

            var face = math3D.buildCollisionFaceFromPoints(points);

            var result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 0, 2]);

            assert(result == 1);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 0, 3]);

            assert(result == 2);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 0, 0]);

            assert(result == -1);

            result = math3D.calculatePointDistanceFromPlane(face.facePlane, [0, 0, -1]);

            assert(result == -2);
        },

        'Math3D.buildCollisionFaceFromPoints.edgePlaneCheck.lookingUpZ': function () {

            var points = [
				[0, 1, 1],
				[0, 0, 1],
				[1, 0, 1]
            ];

            var face = math3D.buildCollisionFaceFromPoints(points);

            var result = math3D.calculatePointDistanceFromPlane(face.edgePlanes[0], [-1, 0, 0]);

            assert(result == 1);

            result = math3D.calculatePointDistanceFromPlane(face.edgePlanes[0], [1, 0, 0]);

            assert(result == -1);

            result = math3D.calculatePointDistanceFromPlane(face.edgePlanes[1], [0, -1, 0]);

            assert(result == 1);

            result = math3D.calculatePointDistanceFromPlane(face.edgePlanes[1], [0, 1, 0]);

            assert(result == -1);

            result = math3D.calculatePointDistanceFromPlane(face.edgePlanes[2], [1, 1, 0]);

            assert(result > 0);

            result = math3D.calculatePointDistanceFromPlane(face.edgePlanes[2], [0, 0, 0]);

            assert(result < 0);
        },

        'Math3D.findNearestPointOnCollisionFacePerimeterToPoint': function () {

            var points = [
				[0, 10, 3],
				[0, 0, 3],
				[5, 0, 3]
            ];

            var face = math3D.buildCollisionFaceFromPoints(points);

            // Check 1.
            var result = vec3.create();

            math3D.findNearestPointOnCollisionFacePerimeterToPoint(result, face, [-1, 5, 0]);

            assert(areNearlyEqual(result[0], 0));
            assert(areNearlyEqual(result[1], 5));
            assert(areNearlyEqual(result[2], 3));

            // Check 2.
            math3D.findNearestPointOnCollisionFacePerimeterToPoint(result, face, [-100, 20, 30]);

            assert(areNearlyEqual(result[0], 0));
            assert(areNearlyEqual(result[1], 10));
            assert(areNearlyEqual(result[2], 3));

            // Check 3.
            math3D.findNearestPointOnCollisionFacePerimeterToPoint(result, face, [3, -20, 10]);

            assert(areNearlyEqual(result[0], 3));
            assert(areNearlyEqual(result[1], 0));
            assert(areNearlyEqual(result[2], 3));
        },

        'Math3D.determineIfPointOnFacePlaneIsWithinCollisionFace': function () {

            var points = [
				[0, 10, 3],
				[0, 0, 3],
				[5, 0, 3]
            ];

            var face = math3D.buildCollisionFaceFromPoints(points);

            // Check 1.
            var result = math3D.determineIfPointOnFacePlaneIsWithinCollisionFace(face, [2, 5, 3]);

            assert(result == true);

            // Check 2.
            result = math3D.determineIfPointOnFacePlaneIsWithinCollisionFace(face, [-1, 5, 3]);

            assert(result == false);

            // Check 3.
            result = math3D.determineIfPointOnFacePlaneIsWithinCollisionFace(face, [2, -1, 3]);

            assert(result == false);
        },

        'BitField': function () {

            var bf = new BitField();

            bf.reset(20);

            bf.setBit(0);
            bf.setBit(0);
            bf.setBit(3);
            bf.setBit(4);
            bf.setBit(7);
            bf.setBit(9);
            bf.unsetBit(9);
            bf.setBit(9);
            bf.unsetBit(10);
            bf.setBit(11);
            bf.setBit(12);
            bf.setBit(13);
            bf.setBit(14);
            bf.unsetBit(17);
            bf.unsetBit(17);
            bf.setBit(19);

            assert(bf.getBit(0));
            assert(!bf.getBit(1));
            assert(!bf.getBit(2));
            assert(bf.getBit(3));
            assert(bf.getBit(4));
            assert(!bf.getBit(5));
            assert(!bf.getBit(6));
            assert(bf.getBit(7));
            assert(!bf.getBit(8));
            assert(bf.getBit(9));
            assert(!bf.getBit(10));
            assert(bf.getBit(11));
            assert(bf.getBit(12));
            assert(bf.getBit(13));
            assert(bf.getBit(14));
            assert(!bf.getBit(15));
            assert(!bf.getBit(16));
            assert(!bf.getBit(17));
            assert(!bf.getBit(18));
            assert(bf.getBit(19));
            assert(bf.countSetBits() == 10);
        }
    }
}