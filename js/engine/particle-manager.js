function ParticleManager(engine) {

    this.spawnParticle = function (emitter) {

        var particle = null;

        for (var i = 0; i < emitter.particles.length; i++) {

            var possibleParticle = emitter.particles[i];

            if (!possibleParticle.active) {
                particle = possibleParticle;
                break;
            }
        }

        if (particle == null) {

            particle = {
                active: false,
                position: [0, 0, 0],
                direction: [0, 0, 0],
			    textureIds: [null, null, null, null],
			    data: null,
			    physics: {}
            }

            emitter.particles.push(particle);
        }

        particle.physics.mode = ParticlePhysicsMode.None;
        particle.physics.lastCollisionType = ParticleCollisionType.None;

        engine.mapDataHelper.checkParticleData(emitter, particle);

        particle.active = true;

        return particle;
    }

    this.heartbeat = function () {

        for (var emitterId in engine.map.emittersById) {

            var emitter = engine.map.emittersById[emitterId];

            for (var i = 0; i < emitter.particles.length; i++) {

                var particle = emitter.particles[i];

                if (!particle.active) {
                    continue;
                }

                if (emitter.particleControllerId != null) {

                    var particleController = engine.particleControllersById[emitter.particleControllerId];

                    particleController.heartbeat(emitter, i);
                }
            }
        }
    }
}