function GuiLayoutAnimationManager(engine) {

    this.guiLayoutAnimationExpansionSetsByLayoutId = {
    }

    this.getGuiLayoutAnimationExpansion = function (layoutId, animationId) {

        var set = this.guiLayoutAnimationExpansionSetsByLayoutId[layoutId];
        if (set == null) {
            return null;
        }

        var animationExpansion = set[animationId];
        
        return animationExpansion;
    }

    this.buildGuiLayoutAnimationExpansion = function (layoutId, animationId) {

        var set = this.guiLayoutAnimationExpansionSetsByLayoutId[layoutId];
        if (set == null) {
            set = {}
            this.guiLayoutAnimationExpansionSetsByLayoutId[layoutId] = set;
        }

        var animationExpansion = {
            tweenIndexesByFrameIndex: []
        }

        set[animationId] = animationExpansion;

        var layout = engine.guiLayoutManager.getGuiLayout(layoutId);
        var animation = layout.animationsById[animationId];

        for (var i = 0; i < animation.numberOfFrames; i++) {
            animationExpansion.tweenIndexesByFrameIndex[i] = [];
        }

        for (var tweenIndex = 0; tweenIndex < animation.tweens.length; tweenIndex++) {

            var tween = animation.tweens[tweenIndex];

            for (var frameIndex = tween.startFrameIndex; frameIndex < tween.startFrameIndex + tween.numberOfFrames; frameIndex++) {
                animationExpansion.tweenIndexesByFrameIndex[frameIndex].push(tweenIndex);
            }
        }

        /*for (var keyFrameIndex = 0; keyFrameIndex < animation.keyFrames.length; keyFrameIndex++) {

            var keyFrame = animation.keyFrames[keyFrameIndex];

            var fromKeyFrameIndex = this.findPreviousKeyFrameIndexForTargetAndProperty(
                animation, keyFrame.frameIndex, keyFrame.targetId, keyFrame.propertyId);

            var fromKeyFrame = fromKeyFrameIndex != -1 ? animation.keyFrames[fromKeyFrameIndex] : null;

            this.pushKeyFramesOntoAnimationExpansion(
                animationExpansion, fromKeyFrameIndex, fromKeyFrame, keyFrameIndex, keyFrame);
        }*/
        
    }

    /*this.findPreviousKeyFrameIndexForTargetAndProperty = function (animation, currentFrameIndex, targetId, propertyId) {

        for (var frameIndex = currentFrameIndex - 1; frameIndex >= 0; frameIndex--) {

            for (var keyFrameIndex = 0; keyFrameIndex < animation.keyFrames.length; keyFrameIndex++) {

                var keyFrame = animation.keyFrames[keyFrameIndex];

                if (keyFrame.frameIndex == frameIndex && keyFrame.targetId == targetId && keyFrame.propertyId == propertyId) {

                    return keyFrameIndex;
                }
            }
        }

        return -1;
    }

    this.pushKeyFramesOntoAnimationExpansion = function (animationExpansion, fromKeyFrameIndex, fromKeyFrame, toKeyFrameIndex, toKeyFrame) {

        var fromFrameIndex = fromKeyFrame != null ? fromKeyFrame.frameIndex : 0;
        var toFrameIndex = toKeyFrame.frameIndex;

        for (var frameIndex = fromFrameIndex; frameIndex <= toFrameIndex; frameIndex++) {

            animationExpansion.frames[frameIndex].push([fromKeyFrameIndex, toKeyFrameIndex]);
        }
    }*/

}