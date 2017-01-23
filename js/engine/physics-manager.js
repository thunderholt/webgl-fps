function PhysicsManager(engine) {

    this.runPhysics = function () {

        this.runPhysicsForActors();
        this.runPhysicsForParticles();
    }

    this.runPhysicsForActors = function () {

        for (var actorId in engine.map.actorsById) {

            this.runPhysicsForActor(actorId);
        }
    }

    this.runPhysicsForParticles = function () {

        for (var emitterId in engine.map.emittersById) {

            var emitter = engine.map.emittersById[emitterId];

            for (var i = 0; i < emitter.particles.length; i++) {

                var particle = emitter.particles[i];

                if (!particle.active) {
                    continue;
                }

                if (particle.physics.mode == ParticlePhysicsMode.MoveThroughMap) {

                    this.runMoveThroughMapPhysicsForParticle(particle);
                }
            }
        }
    }

    this.runPhysicsForActor = function (actorId) {

        var actor = engine.map.actorsById[actorId];
        if (!actor.active) {
            return;
        }

        var actorRenderState = engine.renderStateManager.actorRenderStatesById[actor.id];

        if (actorRenderState.physics.mode == ActorPhysicsMode.OffsetThroughEther) {

            this.runOffsetThroughEtherPhysicsForActor(actor, actorRenderState);

        } else if (actorRenderState.physics.mode == ActorPhysicsMode.PushThroughMap) {

            this.runPushThroughMapPhysicsForActor(actor, actorRenderState);
        }
    }

    this.runOffsetThroughEtherPhysicsForActor = function (actor, actorRenderState) {

        var frameDelta = engine.frameTimer.frameDelta;
        var delta = actorRenderState.physics.speed * frameDelta;

        for (var i = 0; i < 3; i++) {
            var current = actor.positionOffset[i];
            var target = actorRenderState.physics.targetPositionOffset[i];

            if (target > current) {
                actor.positionOffset[i] = Math.min(current + delta, target);
            } else {
                actor.positionOffset[i] = Math.max(current - delta, target);
            }
        }
    }

    this.runPushThroughMapPhysicsForActor = function (actor, actorRenderState) {

        if (actor.collisionSphere == null) {
            return;
        }

        var frameDelta = engine.frameTimer.frameDelta;

        var movementAmount = actorRenderState.physics.speed * frameDelta;

        // Move the sphere through the map.
        engine.mapManager.moveSphereThroughMap(
           actorRenderState.transformedCollisionSphere,
            actorRenderState.physics.movementNormal,
            movementAmount, 
            actorRenderState.physics.applyGravity);

        // Update the actor's position.
        vec3.sub(actor.position, actorRenderState.transformedCollisionSphere.position, actor.collisionSphere.position);
    }

    this.runMoveThroughMapPhysicsForParticle = function (particle) {

        var $ = this.$runMoveThroughMapPhysicsForParticle;

        var frameDelta = engine.frameTimer.frameDelta;
        var player = engine.map.player;

        vec3.copy($.collisionLine.from, particle.position);
        vec3.scaleAndAdd($.collisionLine.to, particle.position, particle.direction, 0.7 * frameDelta);
        math3D.buildCollisionLineFromFromAndToPoints($.collisionLine);

        // See if the particle collides with an actor.
        var collidingActor = engine.mapManager.findNearestLineIntersectionWithActor($.actorCollisionPoint, $.collisionLine);
        var collidesWithActor = collidingActor != null && collidingActor.id != particle.creatorActorId;

        // See if the particle collides with the map.
        var collidesWithMap = engine.mapManager.findNearestLineIntersectionWithMap($.mapCollisionPoint, $.collisionLine);

        // See if the particle collides with the player.
        var collidesWithPlayer = false;
        if (particle.canCollideWithPlayer) {

            vec3.copy($.playerHitSphere.position, player.position);
            collidesWithPlayer = math3D.determineIfCollisionLineIntersectsSphere($.collisionLine, $.playerHitSphere);
            $.playerCollisionPoint = player.position; // Hmm, slightly dubious.
        }

        // If the particle collides with multiple things, see which is nearest.
        var nearestCollisionType = ParticleCollisionType.None;
        var nearestCollisionPointDistanceSqr = -1;

        if (collidesWithActor) {
            nearestCollisionType = ParticleCollisionType.Actor;
            nearestCollisionPointDistanceSqr = vec3.sqrDist(particle.position, $.actorCollisionPoint);
        }

        if (collidesWithMap) {

            var distanceSqr = vec3.sqrDist(particle.position, $.mapCollisionPoint);
            if (distanceSqr < nearestCollisionPointDistanceSqr || nearestCollisionPointDistanceSqr == -1) {
                nearestCollisionType = ParticleCollisionType.Map;
                nearestCollisionPointDistanceSqr = distanceSqr;
            }
        }

        if (collidesWithPlayer) {

            var distanceSqr = vec3.sqrDist(particle.position, $.playerCollisionPoint);
            if (distanceSqr < nearestCollisionPointDistanceSqr || nearestCollisionPointDistanceSqr == -1) {
                nearestCollisionType = ParticleCollisionType.Player;
                nearestCollisionPointDistanceSqr = distanceSqr;
            }
        }

        // Handle the collision.
        particle.physics.lastCollisionType = nearestCollisionType;
        
        if (nearestCollisionType == ParticleCollisionType.Actor) {

            vec3.copy(particle.position, $.actorCollisionPoint);
            particle.physics.collidingActorId = collidingActor.id;

            console.log('Particle collided with actor: ' + collidingActor.id + '!');

        } else if (nearestCollisionType == ParticleCollisionType.Map) {

            vec3.copy(particle.position, $.mapCollisionPoint);

            console.log('Particle collided with map!');

        } else if (nearestCollisionType == ParticleCollisionType.Player) {

            console.log('Particle collided with player!');

        } else {

            // No collision, just move the particle to its new position.
            vec3.copy(particle.position, $.collisionLine.to);
        }
    }

    // Function locals.
    this.$runMoveThroughMapPhysicsForParticle = {
        collisionLine: new CollisionLine(null, null, null, null),
        actorCollisionPoint: vec3.create(),
        mapCollisionPoint: vec3.create(),
        playerCollisionPoint: vec3.create(),
        playerHitSphere: new Sphere(null, 0.2)
    }
}