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
    }
}