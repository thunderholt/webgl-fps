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
    //MaxVisibleWorldStaticMeshChunkIndexesForCamera: 1000,
    //MaxVisibleWorldStaticMeshChunkIndexesPerLight: 400,
    MaxVisibleActorsIdsPerLight: 100,
    MaxVisibleActorsIdsForCamera: 100,
    //MaxActorResidentSectorIndexes: 16,
    MaxVisibleLightIdsForCamera: 1000,
    MaxEffectiveLightsPerObject: 5 
}

var RgbColours = {
    Red: [1, 0, 0],
    Green: [0, 1, 0],
    Blue: [0, 0, 1],
    White: [1, 1, 1]
}

var FaceIntersectionType = {
    None: 0,
    FrontSide: 1,
    BackSide: 2
}

var SpritePropertyId = {
    PositionXOffset: 1,
    PositionYOffset: 2,
    SizeXOffset: 3,
    SizeYOffset: 4,
    RotationOffset: 5,
    Visible: 6
}

var ActorPhysicsMode = {
    None: 0,
    OffsetThroughEther: 1,
    PushThroughMapTowardsDirection: 2,
    PushThroughMapTowardsDestination: 3
}

var ParticlePhysicsMode = {
    None: 0,
    MoveThroughMap: 1
}

var ParticleCreator = {
    None: 0,
    Player: 1,
    Actor: 2
}

var ParticleCollisionType = {
    Actor: 0,
    Map: 1,
    Player: 2
}