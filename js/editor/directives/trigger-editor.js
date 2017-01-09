editorApp.directive('triggerEditor', ['$rootScope', function ($rootScope) {
    return {
        templateUrl: 'html/editor/directives/trigger-editor.html',
        scope: {

        },
        controller: function ($scope) {

            $scope.loadDataSchema = function () {

                $scope.dataSchema = null;
                var controller = engine.triggerControllersById[$scope.trigger.controllerId];
                if (controller != null) {
                    $scope.dataSchema = controller.dataSchema;
                }
            }
        },
        link: function ($scope, element, attrs) {

            $scope.$on('edit-trigger', function (event, args) {

                $scope.trigger = engine.map.triggersById[args.triggerId];

                $scope.loadDataSchema();
            });
        }
    }
}]);