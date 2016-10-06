function MathAABB() {

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
}