editorApp.factory('util', [function () {

    var util = {

        countHashTableKeys: function (hashtable) {

            var count = 0;

            for (var propName in hashtable) {

                count++;
            }

            return count;
        }
    }

    return util;
}]);