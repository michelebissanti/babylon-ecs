import { AnimationGroup } from '@babylonjs/core';

export class AnimationComponent {
    animGroup: AnimationGroup[];
    state: string = "pause";
    id: string;
    isStoppable: boolean = false;
    currentFrame: number = 0;

    constructor(animGroup: AnimationGroup[]) {
        this.animGroup = animGroup;
    }
}