import { Engine, Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder, System } from "tick-knock";
import { AbstractMesh, KeyboardEventTypes, Matrix, Mesh, MeshBuilder, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { ClientComponent } from "../components/ClientComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { Room } from "colyseus.js";
import { Utils } from "../utils";

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

    onAddedToEngine() {
        Utils.waitForConditionAsync(_ => {
            return Utils.room != null;
        }).then(_ => {
            //quando si aggiunge un entità al server
            Utils.room.state.entities.onAdd(async (serverEntity) => {
                //entra solo se chi ha inviato il messaggio non sono io
                if (serverEntity.sender != Utils.room.sessionId) {

                    let joiner = new Entity();
                    //const playerAvatar = await this.ImportPlayerModel();
                    joiner.addComponent(new EntityMultiplayerComponent(true));
                    this.engine.addEntity(joiner);

                    if (serverEntity.id != undefined) {
                        joiner.get(EntityMultiplayerComponent).serverId = serverEntity.id;
                    }

                    this.Entities[serverEntity.id] = joiner.id;
                }


            });

            Utils.room.state.entities.onRemove((serverEntity) => {
                let playerEntity = this.engine.getEntityById(this.Entities[serverEntity.id]);
                this.engine.removeEntity(playerEntity);
                delete this.Entities[serverEntity.id];
            });

            Utils.room.onLeave(code => {
            })
        });

    }

    protected updateEntity(entity: Entity, dt: number): void {
        if (entity.has(ClientComponent)) {
            this.room = entity.get(ClientComponent).room;


        }

        if (this.room != null) {
            if (this.init) {


                this.init = false;
            }


            //invio al server la presenza di nuove entità
            if (entity.has(EntityMultiplayerComponent)) {

                if (entity.get(EntityMultiplayerComponent).send == true && entity.get(EntityMultiplayerComponent).serverId == undefined) {

                    this.room.onMessage("playerCreated", (message) => {
                        entity.get(EntityMultiplayerComponent).serverId = message;
                        console.log(message);
                        this.room.removeAllListeners();
                    });



                    //console.log(entity.get(EntityMultiplayerComponent).serverId);

                }

                if (entity.get(EntityMultiplayerComponent).send == false && entity.get(EntityMultiplayerComponent).serverId == undefined) {
                    this.room.send("createEntity", {
                    });

                    this.room.onMessage("entityCreated", (message) => {
                        entity.get(EntityMultiplayerComponent).send = true;
                        entity.get(EntityMultiplayerComponent).serverId = message;
                        console.log(message);
                        this.room.removeAllListeners();
                    });








                    //console.log(entity.get(EntityMultiplayerComponent).serverId);
                }


            }
        }
    }
}