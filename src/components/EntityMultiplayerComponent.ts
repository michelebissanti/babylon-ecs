// questa componente serve a sincronizzare l'entità ecs con il server
export class EntityMultiplayerComponent {
    serverId: string;
    send: boolean = false;
    loading: boolean = false;
    delete: string = "";
    busy: string = undefined;
    isPlayer: boolean = false;

    constructor(send?: boolean, isPlayer?: boolean) {
        this.send = send;
        this.isPlayer = isPlayer;
    }
}