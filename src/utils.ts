import { AbstractMesh, SceneLoader } from "@babylonjs/core";
import { Room } from "colyseus.js";
import { Engine, Entity } from "tick-knock";
import { EntityMultiplayerComponent } from "./components/EntityMultiplayerComponent";
import { TransformComponent } from "./components/TransformComponent";
import { MeshMultiComponent } from "./components/MeshMultiComponent";
import { MeshArrayComponent } from "./components/MeshArrayComponent";

export class Utils {
    public static room: Room;
    public static savedEntities = new Map<string, number>();


    static waitForConditionAsync(conditionFunction, timerInMs?: number, timeout?: number) {
        var isExpired = false;
        const poll = async resolve => {
            if (isExpired || await conditionFunction()) resolve();
            else setTimeout(_ => poll(resolve), timerInMs ? timerInMs : 100);
        }

        if (timeout) {
            setTimeout(() => isExpired = true, timeout);
        }

        return new Promise(poll);
    }

    static async importModel(baseUrl: string, modelName: string): Promise<AbstractMesh[]> {

        let { meshes } = await SceneLoader.ImportMeshAsync(
            null,
            baseUrl,
            modelName
        );

        return meshes;
    }

    static setServerTrigger(engine: Engine) {

        Utils.waitForConditionAsync(_ => {
            return Utils.room != null;
        }).then(_ => {
            //quando si aggiunge un entità al server
            Utils.room.state.entities.onAdd(async (serverEntity) => {
                //entra solo se chi ha inviato il messaggio non sono io
                if (serverEntity.sender != Utils.room.sessionId) {
                    console.log("nuova entita da server");
                    let joiner = new Entity();
                    //const playerAvatar = await this.ImportPlayerModel();
                    joiner.addComponent(new EntityMultiplayerComponent(true));
                    engine.addEntity(joiner);

                    if (serverEntity.id != undefined) {
                        joiner.get(EntityMultiplayerComponent).serverId = serverEntity.id;
                    }

                    Utils.savedEntities.set(serverEntity.id, joiner.id);
                    //this.Entities[serverEntity.id] = joiner.id;
                }


            });

            Utils.room.state.entities.onRemove((serverEntity) => {
                let playerEntity = engine.getEntityById(this.savedEntities.get(serverEntity.id));
                engine.removeEntity(playerEntity);
                Utils.savedEntities.delete(serverEntity.id);
                //delete this.Entities[serverEntity.id];
            });

            Utils.room.onLeave(code => {
            });




            //quando si aggiunge un componente di transform
            Utils.room.state.transformComponents.onAdd(async (entityServer, client) => {
                //cercare se esiste un entità con quel server id
                if (Utils.savedEntities.has(entityServer.id)) {
                    if (entityServer.sender != Utils.room.sessionId) {
                        console.log("nuova comp transform");
                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));
                        localEntity.add(new TransformComponent());
                        localEntity.get(TransformComponent).id = entityServer.id;

                        let transform = localEntity.get(TransformComponent);

                        transform.x = entityServer.x;
                        transform.y = entityServer.y;
                        transform.z = entityServer.z;
                        transform.rotation_x = entityServer.rotation_x;
                        transform.rotation_y = entityServer.rotation_y;
                        transform.rotation_z = entityServer.rotation_z;
                        transform.rotation_w = entityServer.rotation_w;
                        transform.scale_x = entityServer.scale_x;
                        transform.scale_y = entityServer.scale_y;
                        transform.scale_z = entityServer.scale_z;

                        entityServer.onChange(() => {
                            //aggiorno il modello prendendo la sua entità
                            let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                            //aggiorno solo se non sono io a mandare l'update
                            if (entityServer.sender != Utils.room.sessionId) {

                                let transform = localEntity.get(TransformComponent);

                                transform.x = entityServer.x;
                                transform.y = entityServer.y;
                                transform.z = entityServer.z;
                                transform.rotation_x = entityServer.rotation_x;
                                transform.rotation_y = entityServer.rotation_y;
                                transform.rotation_z = entityServer.rotation_z;
                                transform.rotation_w = entityServer.rotation_w;
                                transform.scale_x = entityServer.scale_x;
                                transform.scale_y = entityServer.scale_y;
                                transform.scale_z = entityServer.scale_z;

                            }


                        });
                    }
                }

            });

            Utils.room.state.transformComponents.onRemove((entity) => {

            });






            //quando si aggiunge un componente di mesh
            Utils.room.state.meshComponents.onAdd(async (entityServer) => {

                if (Utils.savedEntities.has(entityServer.id)) {
                    if (entityServer.sender != Utils.room.sessionId) {
                        console.log("nuova comp mesh");

                        let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));
                        //gli id coincidono quindi questa entità ha anche la componente di transform
                        localEntity.add(new MeshMultiComponent(entityServer.location, entityServer.name, false));

                        //istanzio la mesh qui
                        //localEntity.add(new MeshArrayComponent(await this.importModel(entityServer.location, entityServer.name), localEntity.id));

                        entityServer.onChange(async () => {
                            //aggiorno il modello prendendo la sua entità
                            let localEntity = engine.getEntityById(Utils.savedEntities.get(entityServer.id));

                            //aggiorno solo se non sono io a mandare l'update
                            if (entityServer.sender != Utils.room.sessionId) {
                                localEntity.get(MeshMultiComponent).location = entityServer.location;
                                localEntity.get(MeshMultiComponent).name = entityServer.name;
                                localEntity.get(MeshMultiComponent).render = false;

                                //aggiorno e istanzio le modifiche
                                if (localEntity.has(MeshArrayComponent)) {
                                    localEntity.get(MeshArrayComponent).meshes[0].dispose();

                                    //localEntity.get(MeshArrayComponent).meshes = await Utils.importModel(entityServer.location, entityServer.name);
                                }

                            }

                        });

                    }
                }

            });

            /* Utils.room.state.transform.onRemove((entity) => {
            
            
            }); */






        });

    }
}