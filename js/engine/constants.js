var ShadowMapBuildResult = {
    NotBuilt: 0,
    Built: 1,
    BuiltWithDynamicObjects: 2,
    BuiltWithoutDynamicObjects: 3
}

var FrustumPlane = {
    Near: 0,
    Far: 1,
    Top: 2,
    Bottom: 3,
    Left: 4,
    Right: 5
}

var EngineLimits = {
    MaxVisibleWorldStaticMeshChunkIndexesForCamera: 1000,
    MaxVisibleWorldStaticMeshChunkIndexesPerLight: 400,
    MaxVisibleActorsIdsPerLight: 100,
    MaxVisibleActorsIdsForCamera: 100,
    MaxVisibleLightIdsForCamera: 1000,
    MaxEffectiveLightsPerObject: 5 
}