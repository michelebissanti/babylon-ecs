
export class TransformComponent {
    id: string = null;
    x: number;
    y: number;
    z: number;
    rotation_x: number;
    rotation_y: number;
    rotation_z: number;
    rotation_w: number;
    scale_x: number;
    scale_y: number;
    scale_z: number;
    update: boolean = false;

    constructor(update?: boolean) {
        this.update = update;
    }
}