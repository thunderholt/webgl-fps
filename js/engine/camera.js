function Camera(engine) {

    // Members.
    this.position = [0, 0, 0];
    this.axes = {
        xAxis: [1, 0, 0],
        yAxis: [0, 1, 0],
        zAxis: [0, 0, 1]
    };

    this.init = function (callback) {

        callback();
    }

    this.makeViewMatrix = function () {

        var viewMatrix = mat4.create();

        var lookAt = vec3.create();
        vec3.add(lookAt, this.position, this.axes.zAxis);

        mat4.lookAt(viewMatrix, this.position, lookAt, this.axes.yAxis);

        return viewMatrix;
    }

    this.makeViewProjMatrix = function (fov, aspectRatio, nearClippingDistance, farClippingDistance) {

        var viewMatrix = this.makeViewMatrix();

        var projMatrix = mat4.create();
        mat4.perspective(projMatrix, fov, aspectRatio, nearClippingDistance, farClippingDistance);

        var viewProjMatrix = mat4.create();
        mat4.multiply(viewProjMatrix, projMatrix, viewMatrix);

        return viewProjMatrix;
    }
}