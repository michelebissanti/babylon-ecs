// questa componente serve a gestire la trasformata di un'entità
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

    // "update" serve a comunicare quando l'aggiornamento del componente deve essere inviato al server
    update: boolean = false;

    // "revertLogic" serve ad invertire la logica del sistema, se è true la trasformata viene presa dalla mesh
    revertLogic: boolean = false;

    constructor(update?: boolean, x?, y?, z?) {
        this.update = update;
        this.x = x;
        this.y = y;
        this.z = z;
    }
}