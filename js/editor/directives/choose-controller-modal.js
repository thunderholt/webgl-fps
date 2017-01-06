editorApp.directive('chooseControllerModal', [function () {
    return {
        templateUrl: 'html/editor/directives/choose-controller-modal.html',
        scope: {

        },
        controller: function ($scope) {

            $scope.chooseController = function (controllerId) {

                $scope.callback(controllerId);

                $scope.closeModal();
            }
        },
        link: function ($scope, element, attrs) {

            $scope.$on('choose-controller', function (event, args) {

                $scope.callback = args.callback;

                var controllerLookupName =
                    args.controllerType == 'game' ? 'gameControllersById' :
                    args.controllerType == 'actor' ? 'actorControllersById' :
                    args.controllerType == 'emitter' ? 'emitterControllersById' :
                    args.controllerType == 'particle' ? 'particleControllersById' :
                    args.controllerType == 'trigger' ? 'triggerControllersById' : null;

                $scope.controllerLookup = engine[controllerLookupName];

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