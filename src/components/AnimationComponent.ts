import { AnimationGroup } from '@babylonjs/core';

export class AnimationComponent {
    animGroup: AnimationGroup[];
    state: string = null;
    id: string;
    isStoppable: boolean = false;
    currentFrame: number;

    constructor(animGroup: AnimationGroup[]) {
        this.animGroup = animGroup;
    }
}