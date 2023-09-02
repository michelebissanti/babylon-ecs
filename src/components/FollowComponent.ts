import { Vector3 } from "@babylonjs/core";
import { TransformComponent } from "./TransformComponent";

// questa componente serve a far seguire un target ad un oggetto
export class FollowComponent {
    target: TransformComponent;
    direction: TransformComponent;

    spacing: Vector3;

    constructor(target: TransformComponent, spacing?: Vector3, direction?: TransformComponent) {
        this.target = target;
        this.spacing = spacing;
        this.direction = direction;
    }
}