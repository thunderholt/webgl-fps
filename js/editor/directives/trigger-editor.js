editorApp.directive('triggerEditor', ['$rootScope', function ($rootScope) {
    return {
        templateUrl: 'html/editor/directives/trigger-editor.html',
        scope: {

        },
        controller: function ($scope) {

            
        },
        link: function ($scope, element, attrs) {

            $scope.$on('edit-trigger', function (event, args) {

                $scope.trigger = engine.map.triggersById[args.triggerId];
            });
        }
    }
}]);