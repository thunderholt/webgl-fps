﻿function TriggerManager(engine) {

    this.triggerStatesByTriggerId = {};

    this.heartbeat = function () {

        for (var triggerId in engine.map.triggersById) {

            var trigger = engine.map.triggersById[triggerId];
            var triggerState = this.coalesceTriggerState(triggerId);
            var triggerController = engine.triggerControllersById[trigger.controllerId];

            // Update the trigger's AABB.
            vec3.copy(triggerState.aabb.from, trigger.position);
            vec3.copy(triggerState.aabb.to, trigger.position);
            triggerState.aabb.to[0] += trigger.size[0];
            triggerState.aabb.to[1] += trigger.size[1];
            triggerState.aabb.to[2] -= trigger.size[2];

            // Determine if the player is within trigger.
            var playerWasPreviouslyWithinTrigger = triggerState.playerIsWithinTrigger;
            triggerState.playerIsWithinTrigger = math3D.checkPointIsWithinAABB(triggerState.aabb, engine.map.player.position);

            var playerHasJustEnteredTrigger = !playerWasPreviouslyWithinTrigger && triggerState.playerIsWithinTrigger;
            var playerHasJustLeftTrigger = playerWasPreviouslyWithinTrigger && !triggerState.playerIsWithinTrigger;

            // Handle events (if there are any).
            if (triggerController != null) {

                if (playerHasJustEnteredTrigger && triggerController.handlePlayerEnter != null) {
                    triggerController.handlePlayerEnter(trigger);
                }

                if (playerHasJustLeftTrigger && triggerController.handlePlayerLeave != null) {
                    triggerController.handlePlayerLeave(trigger);
                }
            }
        }
    }

    this.coalesceTriggerState = function (triggerId) {

        var triggerState = this.triggerStatesByTriggerId[triggerId];

        if (triggerState == null) {

            triggerState = {
                aabb: new AABB(),
                playerIsWithinTrigger: false
            }

            this.triggerStatesByTriggerId[triggerId] = triggerState;
        }

        return triggerState;
    }
}