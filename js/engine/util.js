function Util() {

    this.recurse = function (recursionFunction) {

        var recursor = null;
        var recursionCount = -1;

        recursor = function () {
            recursionCount++;
            recursionFunction(recursor, recursionCount);
        }

        recursor();
    }

    this.getObjectPropertyNames = function (obj) {

        var names = [];
        for (var propertyName in obj) {
            names.push(propertyName);
        }

        return names;
    }

    this.copyObjectPropertiesToOtherObject = function (src, dest) {
        for (var propertyName in src) {
            dest[propertyName] = src[propertyName];
        }
    }

    this.arrayPushMany = function (destArray, srcArray) {
        for (var i = 0; i < srcArray.length; i++) {
            destArray.push(srcArray[i]);
        }
    }

    this.arrayIndexOf = function (array, value) {
        var i = 0;
        for (var i = 0; i < array.length; i++) {
            if (array[i] == value) {
                return i;
            }
        }

        return -1;
    }

    this.stringIsNullOrEmpty = function (s) {

        return s == null || s == '';
    }
}

