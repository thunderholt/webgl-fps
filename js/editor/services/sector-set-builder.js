editorApp.factory('sectorSetBuilder', [function () {

    var sectorSetBuilder = {

        buildSectorSetForStaticMesh: function (staticMesh) {

            var self = this;

            var sectorSet = {
                metrics: {
                    sectorCount: [3, 1, 3],
                    sectorSize: [10, 10, 10]
                },
                sectors: []
            }

            engine.staticMeshMathHelper.buildStaticMeshChunkCollisionFaces(staticMesh);

            var line = new CollisionLine();

            self.forEachSector(sectorSet, function (sectorAIndex, sectorAOrigin) {

                var sector = {
                    visibleSectorIndexes: []
                }

                sectorSet.sectors[sectorAIndex] = sector;

                self.forEachSector(sectorSet, function (sectorBIndex, sectorBOrigin) {

                    if (sectorAIndex == sectorBIndex) {
                        return;
                    }

                    for (var i = 0; i < 10000; i++) {

                        self.createRandomLineBetweenSectors(
                            line, sectorSet.metrics, sectorAOrigin, sectorBOrigin);

                        if (!engine.staticMeshMathHelper.determineIfPointIsWithinStaticMesh(line.from, staticMesh)) {
                            return;
                        }

                        if (!engine.staticMeshMathHelper.determineIfPointIsWithinStaticMesh(line.to, staticMesh)) {
                            return;
                        }

                        if (self.determineIfLineIntersectsAnyFace(line, staticMesh)) {
                            return;
                        }

                        sector.visibleSectorIndexes.push(sectorBIndex);
                    }
                });
            });
        },

        forEachSector: function (sectorSet, callback) {

            var index = 0;
            var origin = vec3.create();

            for (var x = 0; x < engine.sectorSet.metrics.sectorCount[0]; x++) {

                for (var y = 0; y < engine.sectorSet.metrics.sectorCount[1]; y++) {

                    for (var z = 0; z < engine.sectorSet.metrics.sectorCount[2]; z++) {

                        vec3.set(
                            origin,
                            x * sectorSet.metrics.sectorSize[0],
                            y * sectorSet.metrics.sectorSize[1],
                            z * -sectorSet.metrics.sectorSize[2]);

                        callback(index, origin);

                        index++
                    }
                }
            }
        },

        createRandomLineBetweenSectors: function (out, sectorMetrics, sectorAOrigin, sectorBOrigin) {

            this.createRandomPointWithinSector(out.from, sectorMetrics, sectorAOrigin);
            this.createRandomPointWithinSector(out.to, sectorMetrics, sectorBOrigin);

            math3D.buildCollisionLineFromFromAndToPoints(out);
        },

        createRandomPointWithinSector: function (out, sectorMetrics, sectorOrigin) {

            vec3.copy(out, sectorOrigin);

            out[0] += Math.random() * sectorMetrics.sectorSize[0];
            out[1] += Math.random() * sectorMetrics.sectorSize[1];
            out[2] -= Math.random() * sectorMetrics.sectorSize[2];
        },

        determineIfLineIntersectsAnyFace: function (line, staticMesh) {

            for (var chunkIndex = 0; chunkIndex < staticMesh.chunks.length; chunkIndex++) {

                var chunk = staticMesh.chunks[chunkIndex];

                // TODO - AABB check

                for (var faceIndex = 0; faceIndex < chunk.collisionFaces.length; faceIndex++) {

                    var collisionFace = chunk.collisionFaces[faceIndex];

                    var faceIntersectionType = math3D.calculateCollisionLineIntersectionWithCollisionFace(faceIntersection, collisionLine, collisionFace)

                    if (faceIntersectionType != FaceIntersectionType.None) {

                        return true;
                    }
                }
            }

            return false;
        }
    }

    return sectorSetBuilder;
}]);