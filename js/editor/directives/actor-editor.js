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

            $scope.createHitBox = function () {

                $scope.actor.hitBox = new AABB([-0.5, 1, 0.5], [0.5, 0, -0.5]);
            }

            $scope.removeHitBox = function () {

                $scope.actor.hitBox = null;
            }

            $scope.chooseController = function () {

                $rootScope.$broadcast('choose-controller', {
                    controllerType: 'actor',
                    callback: function (controllerId) {
                        $scope.actor.controllerId = controllerId;

                        engine.mapDataHelper.checkActorData($scope.actor);
                        $scope.loadDataSchema();
                    }
                });
            }

            $scope.clearController = function () {

                $scope.actor.controllerId = null;
                $scope.loadDataSchema();
            }

            $scope.loadDataSchema = function () {

                $scope.dataSchema = null;
                var controller = engine.actorControllersById[$scope.actor.controllerId];
                if (controller != null) {
                    $scope.dataSchema = controller.dataSchema;
                }
            }
        },
        link: function ($scope, element, attrs) {

            $scope.$on('edit-actor', function (event, args) {

                $scope.actor = engine.map.actorsById[args.actorId];

                $scope.loadDataSchema();

                engine.renderer.renderingParameters.renderActorIdentifierForActorId = $scope.actor.id;
            });
        }
    }
}]);