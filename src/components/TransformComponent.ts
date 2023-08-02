
export class TransformComponent {
    id: string = null;
    x: number;
    y: number;
    z: number;
    rotation_x: number = 0;
    rotation_y: number = 0;
    rotation_z: number = 0;
    rotation_w: number = 0;
    scale_x: number = 1;
    scale_y: number = 1;
    scale_z: number = 1;
    update: boolean = false;
    revertLogic: boolean = false;

    constructor(update?: boolean, x?, y?, z?) {
        this.update = update;
        this.x = x;
        this.y = y;
        this.z = z;
    }
}