function PlayerController(engine) {

    var self = this;

    this.rotateRate = 0.003;
    this.moveRate = 0.2;

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

        var $ = this.$heartbeat;

        var player = engine.map.player;

        vec3.set($.playerYAxisOnlyRotation, 0, player.rotation[1], 0);
        math3D.buildAxesFromRotations($.movementAxes, $.playerYAxisOnlyRotation);

         math3D.buildMovementNormalFromAxes(
            $.movementNormal, $.movementAxes, engine.keyboard.movementAxisMultipliers);

        var movementAmount = this.moveRate * engine.frameTimer.frameDelta;

        this.movePlayerThoughMap($.movementNormal, movementAmount);

        engine.camera.position = player.position;

        math3D.buildAxesFromRotations(engine.camera.axes, player.rotation);
    }

    this.handleMouseMove = function (event) {

        var player = engine.map.player;

        player.rotation[0] += this.rotateRate * event.movementY * -1;
        player.rotation[1] += this.rotateRate * event.movementX * -1;
    }

    this.movePlayerThoughMap = function (movementNormal, movementAmount) {

        var $ = this.$movePlayerThoughMap;

        var player = engine.map.player;
        var heightOffGround = 1.0;

        vec3.copy($.collisionTestSphere.position, player.position);
        $.collisionTestSphere.radius = 0.45;

        vec3.sub($.collisionTestSphere.position, $.collisionTestSphere.position, [0, heightOffGround, 0]);

        engine.mapManager.moveSphereThroughMap($.collisionTestSphere, movementNormal, movementAmount, true);

        vec3.copy(engine.camera.position, $.collisionTestSphere.position);
        vec3.add(engine.camera.position, engine.camera.position, [0, heightOffGround, 0]);
    }

    // Function locals.
    this.$heartbeat = {
        movementAxes: new Axes(),
        //lookAxes: new Axes(),
        playerYAxisOnlyRotation: vec3.create(),
        movementNormal: vec3.create()
    }

    this.$movePlayerThoughMap = {
        collisionTestSphere: new Sphere()
    }
}