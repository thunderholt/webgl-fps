editorApp.directive('chooseResourceModal', ['ws', function (ws) {
    return {
        templateUrl: 'html/editor/directives/choose-resource-modal.html',
        scope: {

        },
        controller: function ($scope) {

            $scope.chooseResource = function (resourceId) {

                $scope.callback(resourceId);

                $scope.closeModal();
            }
        },
        link: function ($scope, element, attrs) {

            $scope.$on('choose-resource', function (event, args) {

                $scope.callback = args.callback;
                $scope.resourceType = args.resourceType;

                ws.loadResourceIdList($scope.resourceType).then(function (resourceIds) {
                    $scope.resourceIds = resourceIds;
                });

                $scope.showModal();
            });

            $scope.showModal = function () {

                $(element).find('.modal').modal('show');
            }

            $scope.closeModal = function () {

                $(element).find('.modal').modal('hide');
            }
        }
    }
}]);;