
export class EntityMultiplayerComponent {
    serverId: string;
    send: boolean = false;

    constructor(send?: boolean) {
        this.send = send
    }
}