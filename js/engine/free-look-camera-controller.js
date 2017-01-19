function FreeLookCameraController(engine) {

    var self = this;

    this.rotation = vec3.create();
    this.rotateRate = 0.001;
    this.moveRate = 0.3;

    this.init = function (callback) {

        vec3.set(engine.camera.position, 0, 1, 0);

        engine.mouse.addMouseMoveListener(function (event) {

            if (engine.mode != 'editor') {
                return;
            }

            self.handleMouseMove(event);
        });

        callback();
    }

    this.heartbeat = function () {

        var $ = this.$heartbeat;

        var camera = engine.camera;

        math3D.buildAxesFromRotations(camera.axes, this.rotation);

        math3D.buildMovementNormalFromAxes(
            $.movementNormal, camera.axes, engine.keyboard.movementAxisMultipliers);

        var movementAmount = this.moveRate * engine.frameTimer.frameDelta;

        vec3.scaleAndAdd(camera.position, engine.camera.position, $.movementNormal, movementAmount);
    }

    this.handleMouseMove = function (event) {

        this.rotation[0] += this.rotateRate * event.movementY * -1;
        this.rotation[1] += this.rotateRate * event.movementX * -1;
    }

    // Function locals.
    this.$heartbeat = {
        movementNormal: vec3.create()
    }
}