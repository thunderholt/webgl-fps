function PlayerController(engine) {

    var self = this;

    this.rotateRate = 0.002;
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

        var player = engine.map.player;

        var movementAxes = math3D.buildAxesFromRotations([0, player.rotation[1], 0]);

        var movementNormal = math3D.buildMovementNormalFromAxes(
            movementAxes, engine.keyboard.movementAxisMultipliers);

        var movementAmount = this.moveRate * engine.frameTimer.frameDelta;

        this.movePlayerThoughMap(movementNormal, movementAmount);
        //vec3.scaleAndAdd(player.position, player.position, movementNormal, movementAmount);

        engine.camera.position = player.position;

        var lookAxes = math3D.buildAxesFromRotations(player.rotation);

        engine.camera.axes = lookAxes;
    }

    this.handleMouseMove = function (event) {

        var player = engine.map.player;

        player.rotation[0] += this.rotateRate * event.movementY * -1;
        player.rotation[1] += this.rotateRate * event.movementX * -1;
    }

    this.movePlayerThoughMap = function (movementNormal, movementAmount) {

        /*var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (worldStaticMesh == null) {
            return;
        }

        var player = engine.map.player;
        var heightOffGround = 1.0;

        var collisionTestSphere = new Sphere(vec3.clone(player.position), 0.45);
        vec3.sub(collisionTestSphere.position, collisionTestSphere.position, [0, heightOffGround, 0]);

        engine.staticMeshMathHelper.moveSphereThroughStaticMesh(
			collisionTestSphere, worldStaticMesh, movementNormal, movementAmount, true);

        var gravity = 0.2;

        engine.staticMeshMathHelper.moveSphereThroughStaticMesh(
            collisionTestSphere, worldStaticMesh,
            [0, -1, 0], gravity * engine.frameTimer.frameDelta, false);*/

        /*if (this.cameraController.jumpPower == 0) {

            var gravity = 0.2;

            this.moveSphereThroughMap(
				this.collisionTestSphere.position, this.collisionTestSphere.size,
				[0, -1, 0], gravity * this.frameTimer.frameDelta, false);

        } else {

            this.moveSphereThroughMap(
				this.collisionTestSphere.position, this.collisionTestSphere.size,
				[0, 1, 0], this.cameraController.jumpPower * this.frameTimer.frameDelta, false);
        }*/

        var player = engine.map.player;
        var heightOffGround = 1.0;

        var collisionTestSphere = new Sphere(vec3.clone(player.position), 0.45);
        vec3.sub(collisionTestSphere.position, collisionTestSphere.position, [0, heightOffGround, 0]);

        engine.mapManager.moveSphereThroughMap(collisionTestSphere, movementNormal, movementAmount, true);

        vec3.copy(engine.camera.position, collisionTestSphere.position);
        vec3.add(engine.camera.position, engine.camera.position, [0, heightOffGround, 0]);
    }
}