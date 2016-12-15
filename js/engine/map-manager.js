function MapManager(engine) {

    this.moveSphereThroughMap = function (sphere, movementNormal, movementAmount, applyGravity) {

        var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (worldStaticMesh == null) {
            return;
        }

        engine.staticMeshMathHelper.moveSphereThroughStaticMesh(
			sphere, worldStaticMesh, movementNormal, movementAmount, true);

        if (applyGravity) {

            var gravity = 0.4;

            engine.staticMeshMathHelper.moveSphereThroughStaticMesh(
                sphere, worldStaticMesh,
                [0, -1, 0], gravity * engine.frameTimer.frameDelta, false);
        }
    }

    this.determineIfLineIntersectsMap = function (out, collisionLine) {

        var worldStaticMesh = engine.staticMeshManager.getStaticMesh(engine.map.worldStaticMeshId);

        if (worldStaticMesh == null) {
            return false;
        }

        var collidesWithWorldSaticMesh = engine.staticMeshMathHelper.determineIfLineIntersectsStaticMesh(out, collisionLine, worldStaticMesh);

        return collidesWithWorldSaticMesh;
    }
}