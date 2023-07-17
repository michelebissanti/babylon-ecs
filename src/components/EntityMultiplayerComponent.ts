
export class EntityMultiplayerComponent {
    serverId: string;
    send: boolean;

    constructor(send?: boolean) {
        this.send = send
    }
}