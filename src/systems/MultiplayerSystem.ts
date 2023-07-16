import { Engine, Entity, EntitySnapshot, IterativeSystem, Query, QueryBuilder, System } from "tick-knock";
import { AbstractMesh, KeyboardEventTypes, Matrix, Mesh, MeshBuilder, Quaternion, Scene, SceneLoader, Vector3 } from "@babylonjs/core";
import { ClientComponent } from "../components/ClientComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";

export class MultiplayerSystem extends IterativeSystem {
    scene: Scene;
    init = true;
    private Entities: { [playerId: string]: number } = {};
    private models = new Map<string, number>;
    private room = null;

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
                this.room.state.entities.onAdd(async (entity, sessionId) => {
                    if (sessionId != this.room.sessionId) {
                        let joiner = new Entity();
                        //const playerAvatar = await this.ImportPlayerModel();
                        joiner.addComponent(EntityMultiplayerComponent);
                        joiner.get(EntityMultiplayerComponent).serverId = entity.id;

                        this.Entities[entity.id] = joiner.id;

                        this.engine.addEntity(joiner);
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
                if (entity.get(EntityMultiplayerComponent).serverId == null) {
                    this.room.send("createEntity", {
                    });

                    entity.get(EntityMultiplayerComponent).send = true;

                    //qui mi serve sapere l'id dal server come faccio?
                }
            }
        }
    }
}