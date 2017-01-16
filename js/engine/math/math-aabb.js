function MathAABB() {

    this.buildAABBFromPoints = function (out, points) {

        var from = out.from;
        var to = out.to;

        var fromIsSet = false;
        var toIsSet = false;

        for (var i = 0; i < points.length; i++) {
            var point = points[i];

            if (!fromIsSet) {
                vec3.copy(from, point);
                fromIsSet = true;
            } else if (point[0] < from[0]) {
                from[0] = point[0];
            } else if (point[1] < from[1]) {
                from[1] = point[1];
            } else if (point[2] > from[2]) {
                from[2] = point[2];
            }

            if (!toIsSet) {
                vec3.copy(to, point);
                toIsSet = true;
            } else if (point[0] > to[0]) {
                to[0] = point[0];
            } else if (point[1] > to[1]) {
                to[1] = point[1];
            } else if (point[2] < to[2]) {
                to[2] = point[2];
            }
        }
    }

    this.buildAABBPoints = function (out, aabb) {

        /*var points = [
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
        */

        out[0][0] = aabb.from[0]; out[0][1] = aabb.from[1]; out[0][2] = aabb.from[2];
        out[1][0] = aabb.to[0]; out[1][1] = aabb.from[1]; out[1][2] = aabb.from[2];
        out[2][0] = aabb.from[0]; out[2][1] = aabb.to[1]; out[2][2] = aabb.from[2];
        out[3][0] = aabb.to[0]; out[3][1] = aabb.to[1]; out[3][2] = aabb.from[2];
        out[4][0] = aabb.from[0]; out[4][1] = aabb.from[1]; out[4][2] = aabb.to[2];
        out[5][0] = aabb.to[0]; out[5][1] = aabb.from[1]; out[5][2] = aabb.to[2];
        out[6][0] = aabb.from[0]; out[6][1] = aabb.to[1]; out[6][2] = aabb.to[2];
        out[7][0] = aabb.to[0]; out[7][1] = aabb.to[1]; out[7][2] = aabb.to[2];
    }


    this.calculateAABBSize = function (out, aabb) {

        //return [aabb.to[0] - aabb.from[0], aabb.to[1] - aabb.from[1], aabb.from[2] - aabb.to[2]];

        out[0] = aabb.to[0] - aabb.from[0];
        out[1] = aabb.to[1] - aabb.from[1];
        out[2] = aabb.from[2] - aabb.to[2];
    }

    /*this.cloneAABB = function (aabb) {

        return new AABB(vec3.clone(aabb.from), vec3.clone(aabb.to));
    }*/

    this.translateAABB = function (aabb, amount) {

        vec3.add(aabb.from, aabb.from, amount);
        vec3.add(aabb.to, aabb.to, amount);
    }

    this.clampPointToAABB = function (out, point, aabb) {

        vec3.copy(out, point);

        if (point[0] < aabb.from[0]) {
            out[0] = aabb.from[0];
        }

        if (point[1] < aabb.from[1]) {
            out[1] = aabb.from[1];
        }

        if (point[2] > aabb.from[2]) {
            out[2] = aabb.from[2];
        }

        if (point[0] > aabb.to[0]) {
            out[0] = aabb.to[0];
        }

        if (point[1] > aabb.to[1]) {
            out[1] = aabb.to[1];
        }

        if (point[2] < aabb.to[2]) {
            out[2] = aabb.to[2];
        }
    }

    this.checkAAABIntersectsAABB = function (aabb1, aabb2) {

        if (aabb1.from[0] > aabb2.to[0] ||
            aabb1.from[1] > aabb2.to[1] ||
            aabb1.from[2] < aabb2.to[2] ||
            aabb1.to[0] < aabb2.from[0] ||
            aabb1.to[1] < aabb2.from[1] ||
            aabb1.to[2] > aabb2.from[2]) {

            return false;
        }

        return true;
    }

    this.checkPointIsWithinAABB = function (aabb, point) {

        if (aabb.from[0] > point[0] ||
            aabb.from[1] > point[1] ||
            aabb.from[2] < point[2] ||
            aabb.to[0] < point[0] ||
            aabb.to[1] < point[1] ||
            aabb.to[2] > point[2]) {

            return false;
        }

        return true;
    }

    this.checkIfCollisionLineIntersectsAABB = function (aabb) {

        // Front plane
        //var d = -vec3.dot(math3D.axes3D.positiveZ, aabb.from);

        // TODO
    }
}