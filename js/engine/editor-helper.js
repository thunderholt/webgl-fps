﻿function EditorHelper(engine) {

    this.init = function (callback) {

        callback();
    }

    this.addLight = function (light) {

        engine.map.lightsById[light.id] = light;
    }

    this.removeLight = function (lightId) {

        delete engine.map.lightsById[lightId];

        // TODO - should really clean up the light render state and shadow map allocation.
    }

    this.invalidateLight = function (lightId) {

        var lightRenderState = engine.renderStateManager.coalesceLightRenderState(lightId);

        lightRenderState.isDirty = true;
    }

    this.addActor = function (actor) {

        engine.map.actorsById[actor.id] = actor;

        engine.mapDataHelper.checkActorData(actor);
    }

    this.removeActor = function (actorId) {

        delete engine.map.actorsById[actorId];
    }

    this.addTrigger = function (trigger) {

        engine.map.triggersById[trigger.id] = trigger;

        engine.mapDataHelper.checkTriggerData(trigger);
    }

    this.removeTrigger = function (triggerId) {

        delete engine.map.triggersById[triggerId];
    }
}