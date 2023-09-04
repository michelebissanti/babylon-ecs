import { Vector3 } from "@babylonjs/core";
import { TransformComponent } from "./TransformComponent";

// questa componente serve a far seguire un target ad un oggetto
export class FollowComponent {
    target: TransformComponent;
    spacing: Vector3;
    followRotation: boolean = false;

    constructor(target: TransformComponent, spacing?: Vector3, followRotation?: boolean) {
        this.target = target;
        this.spacing = spacing;
        this.followRotation = followRotation;

    }
}