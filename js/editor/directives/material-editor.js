editorApp.directive('materialEditor', ['$rootScope', '$timeout', 'ws', function ($rootScope, $timeout, ws) {
    return {
        templateUrl: '/html/editor/directives/material-editor.html',
        scope: {

        },
        controller: function ($scope) {

            $scope.save = function () {

                /*ws.get(
                    '/ResourceApi/SaveJsonResource',
                    {
                        folder: engine.resourceLoader.getFolderNameForResourceType('material'),
                        oldResourceId: $scope.materialMetaData.oldMaterialId,
                        newResourceId: $scope.materialMetaData.newMaterialId,
                        json: angular.toJson($scope.material)
                    })
                    .then(function () {

                        $scope.materialMetaData.oldMaterialId = $scope.materialMetaData.newMaterialId;

                        if ($scope.callback != null) {
                            $scope.callback();
                        }
                    });*/

                ws.saveJsonResource('material', $scope.materialMetaData.newMaterialId, $scope.material, $scope.materialMetaData.oldMaterialId)
                    .then(function () {
                        $scope.materialMetaData.oldMaterialId = $scope.materialMetaData.newMaterialId;

                        if ($scope.callback != null) {
                            $scope.callback();
                        }
                    });
            }

            $scope.chooseDiffuseTexture = function () {

                $rootScope.$broadcast('choose-resource', {
                    resourceType: 'texture',
                    callback: function (resourceId) {
                        $scope.material.diffuseTextureId = resourceId;
                    }
                });
            }

            $scope.chooseNormalTexture = function () {

                $rootScope.$broadcast('choose-resource', {
                    resourceType: 'texture',
                    callback: function (resourceId) {
                        $scope.material.normalTextureId = resourceId;
                    }
                });
            }

            $scope.chooseSelfIlluminationTexture = function () {

                $rootScope.$broadcast('choose-resource', {
                    resourceType: 'texture',
                    callback: function (resourceId) {
                        $scope.material.selfIlluminationTextureId = resourceId;
                    }
                });
            }

            $scope.clearSelfIlluminationTexture = function () {

                $scope.material.selfIlluminationTextureId = null;
            }
        },
        link: function ($scope, element, attrs) {

            $scope.$on('load-and-edit-material', function (event, args) {

                $scope.callback = args.callback;

                $scope.materialMetaData = {
                    oldMaterialId: args.materialId,
                    newMaterialId: args.materialId
                }

                engine.materialManager.loadMaterial($scope.materialMetaData.oldMaterialId, function (material) {

                    $timeout(function () {
                        $scope.material = material;
                    })
                });
            });
        }
    }
}]);