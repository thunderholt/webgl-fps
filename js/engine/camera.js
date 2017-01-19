function Camera(engine) {

    // Members.
    this.position = vec3.create();

    /*this.axes = {
        xAxis: [1, 0, 0],
        yAxis: [0, 1, 0],
        zAxis: [0, 0, 1]
    };*/
    this.axes = new Axes();

    this.lookAt = vec3.create();
    this.viewMatrix = mat4.create();
    this.projMatrix = mat4.create();
    this.viewProjMatrix = mat4.create();

    this.init = function (callback) {

        callback();
    }

    this.updateMatrixes = function (fov, aspectRatio, nearClippingDistance, farClippingDistance) {

        this.updateViewMatrix();
        this.updateProjMatrix(fov, aspectRatio, nearClippingDistance, farClippingDistance);
        this.updateViewProjMatrix();
    }

    this.updateViewMatrix = function () {

        //var viewMatrix = mat4.create();

        //var lookAt = vec3.create();
        vec3.add(this.lookAt, this.position, this.axes.zAxis);

        mat4.lookAt(this.viewMatrix, this.position, this.lookAt, this.axes.yAxis);

        //return viewMatrix;
    }

    this.updateProjMatrix = function (fov, aspectRatio, nearClippingDistance, farClippingDistance) {

        mat4.perspective(this.projMatrix, fov, aspectRatio, nearClippingDistance, farClippingDistance);
    }

    this.updateViewProjMatrix = function () {

        //var viewMatrix = this.makeViewMatrix();

        //var projMatrix = mat4.create();
        //mat4.perspective(projMatrix, fov, aspectRatio, nearClippingDistance, farClippingDistance);

        //var viewProjMatrix = mat4.create();
        mat4.multiply(this.viewProjMatrix, this.projMatrix, this.viewMatrix);

        //return viewProjMatrix;
    }
}