function MathPlane() {

    this.buildPlaneFromPoints = function (out, points) {

        var vecA = vec3.create();
        var vecB = vec3.create();
        vec3.subtract(vecA, points[1], points[0]);
        vec3.subtract(vecB, points[2], points[0]);

        //var normal = vec3.create();
        vec3.cross(out.normal, vecA, vecB);
        vec3.normalize(out.normal, out.normal);

        out.d = -vec3.dot(out.normal, points[0]);

        //var plane = new Plane(normal, d);

        //return plane;
    }

    this.buildPlaneFromNormalAndPoint = function (normal, point) {

        return new Plane(normal, -vec3.dot(normal, point));
    }

    this.calculatePointDistanceFromPlane = function (plane, point) {

        var distance = vec3.dot(plane.normal, point) + plane.d;

        return distance;
    }

    this.calculatePlaneIntersectionSlideReaction = function (plane, intersection, desiredDirection, desiredDistance) {

        var targetPoint = [0, 0, 0]; // FIXME
        vec3.scaleAndAdd(targetPoint, intersection, desiredDirection, desiredDistance);

        var targetPointToProjectionPointRay = new Ray(targetPoint, plane.normal);

        var projectionPoint = vec3.create(); // FIXME

        var targetPointToProjectionPointRayIntersectsPlane = math3D.calculateRayIntersectionWithPlane(
            projectionPoint, targetPointToProjectionPointRay, plane);

        if (!targetPointToProjectionPointRayIntersectsPlane) {
            return null;
        }

        var slideVector = [0, 0, 0]; // FIXME
        vec3.subtract(slideVector, projectionPoint, intersection);

        var slideDistance = vec3.length(slideVector);

        vec3.normalize(slideVector, slideVector);

        // FIXME
        var result = {
            direction: slideVector,
            distance: slideDistance
        }

        return result;
    }
}