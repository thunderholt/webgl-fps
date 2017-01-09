editorApp.directive('chooseActorModal', [function () {
    return {
        templateUrl: 'html/editor/directives/choose-actor-modal.html',
        scope: {

        },
        controller: function ($scope) {

            $scope.chooseActor = function (actor) {

                $scope.callback(actor);

                $scope.closeModal();
            }
        },
        link: function ($scope, element, attrs) {

            $scope.$on('choose-actor', function (event, args) {

                $scope.callback = args.callback;
                $scope.actorsById = engine.map.actorsById;

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