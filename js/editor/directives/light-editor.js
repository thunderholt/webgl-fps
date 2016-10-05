editorApp.directive('lightEditor', [function () {
    return {
        templateUrl: '/html/editor/directives/light-editor.html',
        scope: {

        },
        controller: function ($scope) {

            $scope.$watch('light', function () {

                if ($scope.light != null) {
                    engine.editorHelper.invalidateLight($scope.light.id);
                }

            }, true);
        },
        link: function ($scope, element, attrs) {

            $scope.$on('edit-light', function (event, args) {

                $scope.light = engine.map.lightsById[args.lightId];

                engine.renderer.renderingOptions.renderLightVolumeForLightId = $scope.light.id;
            });
        }
    }
}]);