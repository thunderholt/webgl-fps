editorApp.directive('actorEditor', ['$rootScope', function ($rootScope) {
    return {
        templateUrl: 'html/editor/directives/actor-editor.html',
        scope: {

        },
        controller: function ($scope) {

            $scope.chooseStaticMesh = function () {

                $rootScope.$broadcast('choose-resource', {
                    resourceType: 'static-mesh',
                    callback: function (resourceId) {
                        $scope.actor.staticMeshId = resourceId;
                    }
                });
            }

            $scope.clearStaticMesh = function () {

                $scope.actor.staticMeshId = null;
            }

            $scope.chooseSkinnedMesh = function () {

                $rootScope.$broadcast('choose-resource', {
                    resourceType: 'skinned-mesh',
                    callback: function (resourceId) {
                        $scope.actor.skinnedMeshId = resourceId;
                    }
                });
            }

            $scope.clearSkinnedMesh = function () {

                $scope.actor.skinnedMeshId = null;
            }

            $scope.chooseSkinnedMeshAnimation = function () {

                $rootScope.$broadcast('choose-resource', {
                    resourceType: 'skinned-mesh-animation',
                    callback: function (resourceId) {
                        $scope.actor.skinnedMeshAnimationId = resourceId;
                    }
                });
            }

            $scope.clearSkinnedMeshAnimation = function () {

                $scope.actor.skinnedMeshAnimationId = null;
            }
        },
        link: function ($scope, element, attrs) {

            $scope.$on('edit-actor', function (event, args) {

                $scope.actor = engine.map.actorsById[args.actorId];

                engine.renderer.renderingParameters.renderActorIdentifierForActorId = $scope.actor.id;
            });
        }
    }
}]);