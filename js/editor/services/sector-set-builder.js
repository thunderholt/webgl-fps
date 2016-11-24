editorApp.factory('sectorSetBuilder', [function () {

    var sectorSetBuilder = {

        buildSectorSetForStaticMesh: function (staticMesh) {

            /*

            build collision faces for static mesh

            for each sector
                for each other sector
                    for number of tests
                        generate line segment
                            if start of line segment is outside map, continue
                            if end of line segment is outside map, continue
                            if line intersects any face continue
                            other sector is visible

            */
        }
    }

    return util;
}]);