import { Engine, Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder, System } from "tick-knock";
import { AbstractMesh, KeyboardEventTypes, Matrix, Mesh, MeshBuilder, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { ClientComponent } from "../components/ClientComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Room } from "colyseus.js";

export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    private Entities: { [playerId: string]: number } = {};
    private models = new Map<string, number>;
    private room: Room = null;

    constructor(scene: Scene) {
        super(new Query((entity) => entity.hasComponent(ClientComponent) || entity.hasComponent(EntityMultiplayerComponent)));
        this.scene = scene;
    }

    async importModel(baseUrl: string, modelName: string): Promise<AbstractMesh[]> {

        let { meshes } = await SceneLoader.ImportMeshAsync(
            null,
            baseUrl,
            modelName,
            this.scene
        );

        return meshes;
    }

    protected updateEntity(entity: Entity, dt: number): void {
        if (entity.has(ClientComponent)) {
            this.room = entity.get(ClientComponent).room;
        }

        if (this.room != null) {
            if (this.init) {
                //quando si aggiunge un entità al server
                this.room.state.entities.onAdd(async (serverEntity, sessionId) => {
                    //entra solo se chi ha inviato il messaggio non sono io
                    if (serverEntity.sender != this.room.sessionId) {

                        console.log(sessionId);

                        let joiner = new Entity();
                        //const playerAvatar = await this.ImportPlayerModel();
                        joiner.addComponent(EntityMultiplayerComponent);
                        this.engine.addEntity(joiner);

                        if (serverEntity.id != undefined) {
                            joiner.get(EntityMultiplayerComponent).serverId = serverEntity.id;
                        }

                        this.Entities[serverEntity.id] = joiner.id;
                    }


                });

                this.room.state.entities.onRemove((player, playerId) => {
                    let playerEntity = this.engine.getEntityById(this.Entities[entity.id]);
                    this.engine.removeEntity(playerEntity);
                    delete this.Entities[entity.id];
                });

                this.room.onLeave(code => {
                })

                this.init = false;
            }


            //invio al server la presenza di nuove entità
            if (entity.has(EntityMultiplayerComponent)) {

                if (entity.get(EntityMultiplayerComponent).send == true && entity.get(EntityMultiplayerComponent).serverId == undefined) {
                    entity.get(EntityMultiplayerComponent).serverId = this.room.state.entityCount;

                    //console.log(entity.get(EntityMultiplayerComponent).serverId);

                }

                if (entity.get(EntityMultiplayerComponent).send == false && entity.get(EntityMultiplayerComponent).serverId == undefined) {
                    this.room.send("createEntity", {
                    });

                    entity.get(EntityMultiplayerComponent).send = true;
                    entity.get(EntityMultiplayerComponent).serverId = this.room.state.entityCount;

                    //console.log(entity.get(EntityMultiplayerComponent).serverId);
                }


            }
        }
    }
}