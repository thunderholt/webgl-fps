function MapDataHelper(engine) {

    this.checkMapData = function () {

        this.checkGameData();
        this.checkActorsData();
        this.checkEmittersData();
        this.checkTriggersData();
    }

    this.checkGameData = function () {

        if (engine.map.gameData == null) {
            engine.map.gameData = {}
        }

        var controller = engine.gameControllersById[engine.map.gameControllerId];

        if (controller != null && controller.dataSchema != null) {

            this.checkData(engine.map.gameData, controller.dataSchema);
        }
    }

    this.checkActorsData = function () {

        for (var actorId in engine.map.actorsById) {

            var actor = engine.map.actorsById[actorId];

            this.checkActorData(actor);
        }
    }

    this.checkActorData = function (actor) {

        if (actor.data == null) {
            actor.data = {}
        }

        var controller = engine.actorControllersById[actor.controllerId];

        if (controller != null && controller.dataSchema != null) {

            this.checkData(actor.data, controller.dataSchema);
        }
    }

    this.checkEmittersData = function () {

        for (var emitterId in engine.map.emittersById) {

            var emitter = engine.map.emittersById[emitterId];

            this.checkEmitterData(emitter);

            for (var i = 0; i < emitter.particles.length; i++) {

                var particle = emitter.particles[i];

                this.checkParticleData(emitter, particle);
            }
        }
    }

    this.checkEmitterData = function (emitter) {

        if (emitter.data == null) {
            emitter.data = {}
        }

        var controller = engine.actorControllersById[emitter.emitterControllerId];

        if (controller != null && controller.dataSchema != null) {

            this.checkData(emitter.data, controller.dataSchema);
        }
    }

    this.checkParticleData = function (emitter, particle) {

        if (particle.data == null) {
            particle.data = {}
        }

        var controller = engine.actorControllersById[emitter.particleControllerId];

        if (controller != null && controller.dataSchema != null) {

            this.checkData(particle.data, controller.dataSchema);
        }
    }

    this.checkTriggersData = function () {

        for (var triggerId in engine.map.triggersById) {

            var trigger = engine.map.triggersById[triggerId];

            this.checkTriggerData(trigger);
        }
    }

    this.checkTriggerData = function (trigger) {

        if (trigger.data == null) {
            trigger.data = {}
        }

        var controller = engine.triggerControllersById[trigger.controllerId];

        if (controller != null && controller.dataSchema != null) {

            this.checkData(trigger.data, controller.dataSchema);
        }
    }

    this.checkData = function (data, dataSchema) {

        for (var propertyName in dataSchema) {

            var property = dataSchema[propertyName];

            if (data[propertyName] == null) {
                data[propertyName] = property.defaultValue;
            }
        }
    }
}