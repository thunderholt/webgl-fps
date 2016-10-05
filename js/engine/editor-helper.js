function EditorHelper(engine) {

    this.init = function (callback) {

        callback();
    }

    this.addLight = function (light) {

        engine.map.lightsById[light.id] = light;

        //engine.renderStateManager.invalidateAllLightRenderStates();
    }

    this.removeLight = function (lightId) {

        delete engine.map.lightsById[lightId];

        // TODO - should really clean up the light render state and shadow map allocation.

        //engine.renderStateManager.invalidateAllRenderStates();
    }

    this.invalidateLight = function (lightId) {

        var lightRenderState = engine.renderStateManager.coalesceLightRenderState(lightId);

        lightRenderState.isDirty = true;
    }

    this.addActor = function (actor) {

        engine.map.actorsById[actor.id] = actor;
    }

    this.removeActor = function (actorId) {

        delete engine.map.actorsById[actorId];
    }
}