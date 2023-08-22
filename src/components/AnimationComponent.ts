import { AnimationGroup, VideoTexture } from '@babylonjs/core';

export class AnimationComponent {
    animGroup: AnimationGroup[];
    state: string = "pause";
    id: string;
    isStoppable: boolean = false;
    currentFrame: number = 0;
    video: VideoTexture;
    isVideo: boolean = false;

    constructor(animGroup?: AnimationGroup[], video?: VideoTexture, isVideo?: boolean) {
        this.animGroup = animGroup;
        this.video = video;
        this.isVideo = isVideo;
    }
}