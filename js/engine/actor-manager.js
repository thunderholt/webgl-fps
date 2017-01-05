function ActorManager(engine) {

    /*this.initActors = function () {

        for (var actorId in this.map.actorsById) {

            var actor = this.map.actorsById[actorId];

            actor.dataInitialised = false;
        }
    }*/

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

            for (var propertyName in controller.dataSchema) {

                var property = controller.dataSchema[propertyName];

                if (actor.data[propertyName] == null) {
                    actor.data[propertyName] = property.defaultValue;
                }
            }
        }
        
    }
}