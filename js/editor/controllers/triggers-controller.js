editorApp.controller('TriggersController', ['$scope', 'util', function ($scope, util) {

    $scope.editTrigger = function (triggerId) {

        $scope.$broadcast('edit-trigger', {
            triggerId: triggerId
        });
    }

    $scope.createTrigger = function () {

        var trigger = {
            id: 'trigger-' + (util.countHashTableKeys(engine.map.triggersById) + 1),
            position: [0, 0, 0],
            size: [0, 0, 0],
            controllerId: null,
            data: {}
        }

        engine.editorHelper.addTrigger(trigger);
    }

    $scope.removeTrigger = function (triggerId) {

        engine.editorHelper.removeTrigger(triggerId);
    }
}]);