editorApp.directive('actorEditor', [function () {
    return {
        templateUrl: '/html/editor/directives/actor-editor.html',
        scope: {

        },
        controller: function ($scope) {

        },
        link: function ($scope, element, attrs) {

            $scope.$on('edit-actor', function (event, args) {

                $scope.actor = engine.map.actorsById[args.actorId];

                engine.renderer.renderingParameters.renderActorIdentifierForActorId = $scope.actor.id;
            });
        }
    }
}]);