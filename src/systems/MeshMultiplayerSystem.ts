import { Color3, DynamicTexture, Matrix, Mesh, MeshBuilder, Scene, SceneLoader, StandardMaterial, Texture, Vector3, VideoTexture } from "@babylonjs/core";
import { Entity, IterativeSystem, Query } from "tick-knock";
import { AnimationComponent } from "../components/AnimationComponent";
import { EntityMultiplayerComponent } from "../components/EntityMultiplayerComponent";
import { MeshArrayComponent } from "../components/MeshArrayComponent";
import { MeshComponent } from "../components/MeshComponent";
import { MeshMultiComponent } from "../components/MeshMultiComponent";
import { Utils } from "../utils";

// MeshMultiplayerSystem: gestisce tutte le entità che possiedono un MeshMultiComponent o che devono istanziarlo
// in generale si occupa di sincronizzare le mesh con il server
export class MeshMultiplayerSystem extends IterativeSystem {
    scene: Scene;

    constructor(scene: Scene) {
        //entra nel loop del sistema solo se ha MeshMultiComponent o EntityMultiplayerComponent
        super(new Query((entity) => (entity.hasComponent(MeshMultiComponent) || entity.hasComponent(EntityMultiplayerComponent))));
        this.scene = scene;
    }

    protected async updateEntity(entity: Entity, dt: number): Promise<void> {

        if (entity.has(MeshMultiComponent)) {
            let meshMultiComponent = entity.get(MeshMultiComponent);

            // se la mesh non è stata istanziata, la istanzio
            if (meshMultiComponent.render == false) {
                meshMultiComponent.render = true;


                if (meshMultiComponent.location == "local" && meshMultiComponent.name == "sphere") {
                    //debug branch

                    entity.add(new MeshComponent(MeshBuilder.CreateSphere('sphere ' + meshMultiComponent.id, { diameter: 1 }, this.scene), entity.id));
                    entity.get(MeshComponent).mesh.setPivotMatrix(Matrix.Translation(0, 0.5, 0), false);
                    entity.get(MeshComponent).mesh.isPickable = false;

                } else if (meshMultiComponent.location == "video") {
                    //se la mesh da istanziare è un video


                    let videoMat = new StandardMaterial("videoMat");
                    let videoTex = new VideoTexture("videoTex", meshMultiComponent.location + "/" + meshMultiComponent.name, this.scene);
                    let planeHeight = null;

                    videoTex.video.onloadeddata = () => {
                        planeHeight = videoTex.video.videoHeight / videoTex.video.videoWidth;

                        let plane = MeshBuilder.CreateBox("", { height: planeHeight, width: 1, depth: 0.01, sideOrientation: Mesh.DOUBLESIDE });
                        plane.isPickable = true;

                        videoMat.diffuseTexture = videoTex;
                        videoMat.roughness = 1;
                        videoMat.emissiveColor = Color3.White();
                        //videoTex.video.volume = 0;
                        videoTex.video.pause();
                        plane.material = videoMat;

                        //setto l'origine ai piedi della mesh, centrata orizzontalmente
                        plane.setPivotMatrix(Matrix.Translation(0, plane.getBoundingInfo().boundingBox.extendSize.y, 0), false);

                        //aggiungo la componente di mesh locale e la componente di animazione
                        entity.add(new MeshComponent(plane, entity.id, false));
                        entity.add(new AnimationComponent(null, videoTex, true));
                    };



                } else if (meshMultiComponent.location == "image") {
                    //se la mesh da istanziare è un immagine

                    //Create dynamic texture
                    let img = new Image();
                    img.src = meshMultiComponent.location + "/" + meshMultiComponent.name;
                    let planeHeight = null;

                    img.onload = function () {
                        planeHeight = img.height / img.width;

                        let textureGround = new DynamicTexture("dynamic texture", img);
                        let textureContext = textureGround.getContext();

                        let boxMaterial = new StandardMaterial("Mat");
                        boxMaterial.diffuseTexture = textureGround;

                        //Add image to dynamic texture
                        textureContext.drawImage(this, 0, 0);
                        textureGround.update();

                        let plane = MeshBuilder.CreateBox("", { height: planeHeight, width: 1, depth: 0.01, sideOrientation: Mesh.DOUBLESIDE });
                        plane.isPickable = true;

                        plane.material = boxMaterial;
                        textureGround.update();

                        //setto l'origine ai piedi della mesh, centrata orizzontalmente
                        plane.setPivotMatrix(Matrix.Translation(0, plane.getBoundingInfo().boundingBox.extendSize.y, 0), false);

                        //aggiungo la componente di mesh locale
                        entity.add(new MeshComponent(plane, entity.id, false));

                    }

                } else {
                    //se la mesh da istanziare è un oggetto 3d

                    let { meshes, animationGroups } = await SceneLoader.ImportMeshAsync(
                        null,
                        meshMultiComponent.location,
                        meshMultiComponent.name
                    );

                    //aggiungo la componente di mesh locale
                    entity.add(new MeshArrayComponent(meshes, entity.id));

                    //se l'oggetto importato ha delle animazioni
                    if (animationGroups.length != 0) {
                        //aggiungo la componente di animazione
                        entity.add(new AnimationComponent(animationGroups, null, false));
                        animationGroups[0].stop();
                        entity.get(AnimationComponent).currentFrame = 0;
                        entity.get(AnimationComponent).state = "pause";
                    }

                    //se l'entità è un player
                    if (entity.get(EntityMultiplayerComponent).isPlayer) {
                        let meshes = entity.get(MeshArrayComponent).meshes;

                        //non posso interagire con la sua mesh
                        meshes.forEach((mesh) => {
                            mesh.isPickable = false;
                        });
                    }

                    //se l'entità è il player locale
                    if (entity.get(MeshMultiComponent).isLocalPlayer) {
                        let meshes = entity.get(MeshArrayComponent).meshes;

                        //non posso interagire con la sua mesh
                        meshes.forEach((mesh) => {
                            mesh.isPickable = false;
                            mesh.visibility = 0;
                        });

                    }

                }


            }
        }

        if (Utils.room != null) {
            if (entity.has(MeshMultiComponent) && entity.has(EntityMultiplayerComponent)) {
                let meshMultiComponent = entity.get(MeshMultiComponent);
                let entityServer = entity.get(EntityMultiplayerComponent);

                //se l'entità non è stata mai inviata al server, invio il segnale di creazione
                if (meshMultiComponent.id == undefined && entityServer.serverId != undefined) {
                    Utils.room.send("attachMeshComponent", {
                        id: "" + entityServer.serverId,
                        location: meshMultiComponent.location,
                        name: meshMultiComponent.name,
                    });

                    meshMultiComponent.id = entityServer.serverId;
                }
            }
        }

    }
}