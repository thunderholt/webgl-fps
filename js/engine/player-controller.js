function PlayerController(engine) {

    var self = this;

    this.rotateRate = 0.004;
    this.moveRate = 0.1;

    this.init = function (callback) {

        engine.mouse.addMouseMoveListener(function (event) {

            if (engine.mode != 'game') {
                return;
            }

            self.handleMouseMove(event);
        });

        callback();
    }

    this.heartbeat = function () {

        var player = engine.map.player;

        var movementAxes = math3D.buildAxesFromRotations([0, player.rotation[1], 0]);

        var movementNormal = math3D.buildMovementNormalFromAxes(
            movementAxes, engine.keyboard.movementAxisMultipliers);

        var movementAmount = this.moveRate * engine.frameTimer.frameDelta;

        vec3.scaleAndAdd(player.position, player.position, movementNormal, movementAmount);

        var lookAxes = math3D.buildAxesFromRotations(player.rotation);

        engine.camera.position = player.position;
        engine.camera.axes = lookAxes;
    }

    this.handleMouseMove = function (event) {

        var player = engine.map.player;

        player.rotation[0] += this.rotateRate * event.movementY * -1;
        player.rotation[1] += this.rotateRate * event.movementX * -1;
    }
}