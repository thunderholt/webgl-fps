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

    this.buildPlaneFromNormalAndPoint = function (out, normal, point) {

        vec3.copy(out.normal, normal);
        out.d = -vec3.dot(normal, point);
    }

    this.calculatePointDistanceFromPlane = function (plane, point) {

        var distance = vec3.dot(plane.normal, point) + plane.d;

        return distance;
    }

    this.calculatePlaneIntersectionSlideReaction = function (out, plane, intersection, desiredDirection, desiredDistance) {

        var $ = this.$calculatePlaneIntersectionSlideReaction;

        vec3.scaleAndAdd($.targetPoint, intersection, desiredDirection, desiredDistance);

        vec3.copy($.targetPointToProjectionPointRay.origin, $.targetPoint);
        vec3.copy($.targetPointToProjectionPointRay.normal, plane.normal);

        var targetPointToProjectionPointRayIntersectsPlane = math3D.calculateRayIntersectionWithPlane(
            $.projectionPoint, $.targetPointToProjectionPointRay, plane);

        if (!targetPointToProjectionPointRayIntersectsPlane) {
            return false;
        }

        vec3.subtract($.slideVector, $.projectionPoint, intersection);

        var slideDistance = vec3.length($.slideVector);

        vec3.normalize($.slideVector, $.slideVector);

        // Copy out the results.
        vec3.copy(out.direction, $.slideVector);
        out.distance = slideDistance;

        return true;
    }

    this.copyPlane = function (out, plane) {

        vec3.copy(out.normal, plane.normal);
        out.d = plane.d;
    }

    // Function locals.
    this.$calculatePlaneIntersectionSlideReaction = {
        targetPoint: vec3.create(),
        targetPointToProjectionPointRay: new Ray(),
        projectionPoint: vec3.create(),
        slideVector: vec3.create()
    }
}