function GuiDrawSpecBuilder(engine) {

    this.buildGuiDrawSpecs = function (out, gui) {

        out.length = 0;

        var guiLayout = engine.guiLayoutManager.getGuiLayout(gui.layoutId);
        if (guiLayout == null) {
            return;
        }

        var spriteSheet = engine.spriteSheetManager.getSpriteSheet(guiLayout.spriteSheetId);
        if (spriteSheet == null) {
            return;
        }

        var texture = engine.textureManager.getTexture(spriteSheet.textureId);
        if (texture == null) {
            return;
        }

        for (var spriteId in guiLayout.spritesById) {

            var sprite = guiLayout.spritesById[spriteId];
      
            var spriteSpec = spriteSheet.spriteSpecsById[sprite.spriteSpecId];
            if (spriteSpec == null) {
                continue;
            }

            var drawSpec = out.items[out.length];
            if (drawSpec == null) {
                drawSpec = {
                    position: vec2.create(),
                    size: vec2.create(),
                    rotation: 0,
                    uvPosition: vec2.create(),
                    uvSize: vec2.create(),
                    visible: false
                }

                out.items[out.length] = drawSpec;
            }

            vec2.copy(drawSpec.position, sprite.position);
            vec2.copy(drawSpec.size, sprite.size);
            drawSpec.rotation = sprite.rotation;

            drawSpec.uvPosition[0] = spriteSpec.position[0] / texture.width;
            drawSpec.uvPosition[1] = spriteSpec.position[1] / texture.height;

            drawSpec.uvSize[0] = spriteSpec.size[0] / texture.width;
            drawSpec.uvSize[1] = spriteSpec.size[1] / texture.height;

            drawSpec.visible = sprite.visible;

            for (var animationId in guiLayout.animationsById) {

                var animationState = gui.animationStatesById[animationId];
                if (animationState == null || !animationState.active) {
                    continue;
                }

                var animation = guiLayout.animationsById[animationId];
                var animationExpansion = engine.guiLayoutAnimationManager.getGuiLayoutAnimationExpansion(guiLayout.id, animation.id);
                if (animationExpansion == null) {
                    continue;
                }

                var frameIndex = Math.floor(animationState.frameIndex);
                var tweenIndexes = animationExpansion.tweenIndexesByFrameIndex[frameIndex];

                for (var i = 0; i < tweenIndexes.length; i++) {

                    var tweenIndex = tweenIndexes[i];
                    var tween = animation.tweens[tweenIndex];

                    if (tween.targetId != sprite.id) {
                        continue;
                    }

                    var value = 0;

                    if (tween.absoluteValue != null) {

                        value = tween.absoluteValue;

                    } else {

                        var lerpFactor = math3D.calculateLerpFactor(tween.startFrameIndex, tween.startFrameIndex + tween.numberOfFrames, frameIndex);
                        value = math3D.lerp(tween.fromValue, tween.toValue, lerpFactor);
                    }

                    if (tween.propertyId == SpritePropertyId.PositionXOffset) {
                        drawSpec.position[0] += value;
                    } else if (tween.propertyId == SpritePropertyId.PositionYOffset) {
                        drawSpec.position[1] += value;
                    } else if (tween.propertyId == SpritePropertyId.SizeXOffset) {
                        drawSpec.size[0] += value;
                    } else if (tween.propertyId == SpritePropertyId.SizeYOffset) {
                        drawSpec.size[1] += value;
                    } else if (tween.propertyId == SpritePropertyId.RotationOffset) {
                        drawSpec.rotation += value;
                    } else if (tween.propertyId == SpritePropertyId.Visible) {
                        drawSpec.visible = value == 1;
                    }
                }
                
            }

            vec2.divide(drawSpec.position, drawSpec.position, guiLayout.size);
            vec2.divide(drawSpec.size, drawSpec.size, guiLayout.size);

            out.length++;
        }
    }
}