function FreeLookCameraController(engine) {

    var self = this;

    this.rotation = [0, 0, 0];
    this.rotateRate = 0.001;
    this.moveRate = 0.3;

    this.init = function (callback) {

        engine.camera.position = [0, 1, 0];

        engine.mouse.addMouseMoveListener(function (event) {

            if (engine.mode != 'editor') {
                return;
            }

            self.handleMouseMove(event);
        });

        callback();
    }

    this.heartbeat = function () {

        var camera = engine.camera;

        camera.axes = math3D.buildAxesFromRotations(this.rotation);

        var movementNormal = math3D.buildMovementNormalFromAxes(
            camera.axes, engine.keyboard.movementAxisMultipliers);

        var movementAmount = this.moveRate * engine.frameTimer.frameDelta;

        vec3.scaleAndAdd(camera.position, engine.camera.position, movementNormal, movementAmount);
    }

    this.handleMouseMove = function (event) {

        this.rotation[0] += this.rotateRate * event.movementY * -1;
        this.rotation[1] += this.rotateRate * event.movementX * -1;
    }
}