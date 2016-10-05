function MapMetaDataBuilder() {

    this.buildMapMetaData = function (worldMesh) {

        var mapMetaData = {
            worldMeshChunkAABBs: this.buildWorldMeshChunkAABBs(worldMesh)
        }

        return mapMetaData;
    }

    this.buildWorldMeshChunkAABBs = function (worldMesh) {

        var worldMeshChunkAABBs = [];

        var indecies = worldMesh.indecies;
        var verts = worldMesh.verts;

        for (var chunkIndex = 0; chunkIndex < worldMesh.chunks.length; chunkIndex++) {

            var chunk = worldMesh.chunks[chunkIndex];

            var chunkPoints = [];

            for (var i = chunk.startIndex; i < chunk.startIndex + chunk.numFaces * 3; i += 3) {

                var vertIndex0 = indecies[i] * 3;
                var vertIndex1 = indecies[i + 1] * 3;
                var vertIndex2 = indecies[i + 2] * 3;

                var facePoints = [
					[verts[vertIndex0], verts[vertIndex0 + 1], verts[vertIndex0 + 2]],
					[verts[vertIndex1], verts[vertIndex1 + 1], verts[vertIndex1 + 2]],
					[verts[vertIndex2], verts[vertIndex2 + 1], verts[vertIndex2 + 2]]
                ];

                util.arrayPushMany(chunkPoints, facePoints);
            }

            var aabb = math3D.buildAABBFromPoints(chunkPoints);

            worldMeshChunkAABBs.push(aabb);
        }

        return worldMeshChunkAABBs;
    }
}