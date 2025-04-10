/* eslint-disable @typescript-eslint/no-redundant-type-constituents */
/* eslint-disable @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-explicit-any */
import * as THREE from 'three';

// Dynamicly imported libraries (if used)
let gsap: GSAP | null = null;
let loadingManager: THREE.LoadingManager | null = null;
let textureLoader: THREE.TextureLoader | null = null;
let gltfLoader: any = null;
let dracoLoader: any = null;
let fbxLoader: any = null;
let fontLoader: any = null;

/**
 * PRELOADING FUNCTIONS
 */

type LoadTextureType = (
	loader: THREE.TextureLoader,
	url: string
) => Promise<THREE.Texture>;
const loadTexture: LoadTextureType = (loader, url) => {
	return new Promise((resolve) => loader.load(url, resolve));
};

type LoadOtherStuffType = (loader: any, url: string) => Promise<any>;
const loadOtherStuff: LoadOtherStuffType = (loader, url) => {
	// eslint-disable-next-line @typescript-eslint/no-unsafe-return
	return new Promise((resolve) => loader.load(url, resolve));
};

type AssetType =
	| 'jpg'
	| 'png'
	| 'jpeg'
	| 'texture'
	| 'gltf'
	| 'glb'
	| 'draco'
	| 'fbx'
	| 'json'
	| 'font';
export type AssetInfoType = {
	name: string;
	url: string;
	type?: AssetType;
};
export type LoadedAssetsType = Record<
	string,
	THREE.Texture | THREE.Object3D | any
>;
export type OnProgressType = (percent: number, isFullyLoaded: boolean) => void;
type LoadAssetsType = (
	assetList: AssetInfoType[],
	onProgress?: OnProgressType,
	dracoDecoderPath?: string
) => Promise<LoadedAssetsType>;
const loadAssets: LoadAssetsType = async (
	assetList,
	onProgress,
	dracoDecoderPath
) => {
	const loadedAssets: LoadedAssetsType = {};
	let isLoading: boolean = false;

	if (!loadingManager) {
		loadingManager = new THREE.LoadingManager();
	}

	if (onProgress) {
		loadingManager.onProgress = (_url, itemsLoaded, itemsTotal) => {
			if (itemsTotal > 0) {
				// only if there is items to load
				isLoading = true;
				const percent = Math.round((itemsLoaded / itemsTotal) * 100);
				onProgress(percent, false);
			}
		};
		loadingManager.onLoad = () => {
			if (isLoading) {
				onProgress(100, true);
			}
		};
	}

	loadingManager.onError = (url) => {
		void Promise.reject(new Error(`Erreur de chargement : ${url}`));
	};

	for (const { name, url, type } of assetList) {
		const extension =
			type ||
			(url.split('.').pop()?.toLowerCase() as AssetType) ||
			'unknown';

		switch (extension) {
			case 'jpg':
			case 'png':
			case 'jpeg':
			case 'texture':
				if (!textureLoader) {
					textureLoader = new THREE.TextureLoader(loadingManager);
				}
				loadedAssets[name] = await loadTexture(textureLoader, url);
				break;

			case 'gltf':
			case 'glb':
			case 'draco':
				if (!gltfLoader) {
					const { GLTFLoader } = await import(
						'three/examples/jsm/loaders/GLTFLoader.js'
					);
					gltfLoader = new GLTFLoader(loadingManager);
				}
				if (!dracoLoader && gltfLoader && extension === 'draco') {
					const { DRACOLoader } = await import(
						'three/examples/jsm/loaders/DRACOLoader.js'
					);
					dracoLoader = new DRACOLoader();
					const decoderPath = dracoDecoderPath || '/script/draco/';
					dracoLoader.setDecoderPath(decoderPath);
					gltfLoader.setDRACOLoader(dracoLoader);
				}
				loadedAssets[name] = (await loadOtherStuff(
					gltfLoader,
					url
				)) as THREE.Object3D;
				break;

			case 'fbx':
				if (!fbxLoader) {
					const { FBXLoader } = await import(
						'three/examples/jsm/loaders/FBXLoader.js'
					);
					fbxLoader = new FBXLoader(loadingManager);
				}
				loadedAssets[name] = (await loadOtherStuff(
					fbxLoader,
					url
				)) as THREE.Object3D;
				break;

			case 'json':
			case 'font':
				if (!fontLoader) {
					const { FontLoader } = await import(
						'three/examples/jsm/loaders/FontLoader.js'
					);
					fontLoader = new FontLoader(loadingManager);
				}

				// eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
				loadedAssets[name] = await loadOtherStuff(fontLoader, url);
				break;

			default:
				console.warn(
					`Type de fichier non supporté pour la scène Three.js : ${url}`
				);
				break;
		}
	}

	return Promise.resolve(loadedAssets);
};

/**
 * DISPOSE FUNCTIONS
 */

// For Material
type DisposeMaterialType = (material: THREE.Material) => void;
const disposeMaterial: DisposeMaterialType = (material) => {
	const textureProps = [
		'map',
		'aoMap',
		'emissiveMap',
		'bumpMap',
		'normalMap',
		'displacementMap',
		'roughnessMap',
		'metalnessMap',
		'alphaMap',
		'envMap',
		'lightMap',
	];

	for (const prop of textureProps) {
		if (prop in material) {
			if ((material as any)[prop] instanceof THREE.Texture) {
				(material as any)[prop].dispose();
				delete (material as any)[prop];
			} else {
				(material as any)[prop] = null;
			}
		}
	}

	if (material instanceof THREE.ShaderMaterial) {
		for (const key in material.uniforms) {
			const uniform = material.uniforms[key];
			if (uniform.value instanceof THREE.Texture) {
				uniform.value.dispose();
				delete uniform.value;
			} else {
				uniform.value = null;
			}
		}
	}

	material.dispose();
};

// For Object
type disposableThreeObjectsType =
	| THREE.BatchedMesh
	| THREE.InstancedMesh
	| THREE.Line
	| THREE.LineLoop
	| THREE.LineSegments
	| THREE.Mesh
	| THREE.Points
	| THREE.SkinnedMesh
	| THREE.Sprite;

type DisposeMeshType = (object: disposableThreeObjectsType) => void;
const disposeMesh: DisposeMeshType = (object: disposableThreeObjectsType) => {
	if (object.geometry) {
		object.geometry.dispose();
	}

	if (object.material) {
		if (Array.isArray(object.material)) {
			object.material.forEach(disposeMaterial);
		} else {
			disposeMaterial(object.material);
		}
	}
};

// For Lights
type disposableThreeLightsType =
	| THREE.AmbientLight
	| THREE.DirectionalLight
	| THREE.HemisphereLight
	| THREE.Light
	| THREE.LightProbe
	| THREE.PointLight
	| THREE.RectAreaLight
	| THREE.SpotLight;

type DisposeLightType = (light: disposableThreeLightsType) => void;
const disposeLight: DisposeLightType = (light: disposableThreeLightsType) => {
	light.dispose();
};

// For Animations
type DisposeMixerType = (mixer: THREE.AnimationMixer) => void;
const disposeMixer: DisposeMixerType = (mixer) => {
	mixer.stopAllAction();

	const root = mixer.getRoot();
	mixer.uncacheRoot(root);
};

// For Audio
type disposableThreeAudioType = THREE.Audio | THREE.PositionalAudio;

type DisposeAudioType = (audio: disposableThreeAudioType) => void;
const disposeAudio: DisposeAudioType = (audio) => {
	audio.stop();
	audio.disconnect();
};

// For Renderer
type DisposeRendererType = (renderer: THREE.WebGLRenderer) => void;
const disposeRenderer: DisposeRendererType = (renderer) => {
	renderer.dispose();
	renderer.forceContextLoss();
};

// For any type of scene's children possible
type DisposeAnyObjectType = (object: THREE.Object3D) => void;
const disposeAnyObject: DisposeAnyObjectType = (object) => {
	if (
		object instanceof THREE.BatchedMesh ||
		object instanceof THREE.InstancedMesh ||
		object instanceof THREE.Line ||
		object instanceof THREE.LineLoop ||
		object instanceof THREE.LineSegments ||
		object instanceof THREE.Mesh ||
		object instanceof THREE.Points ||
		object instanceof THREE.SkinnedMesh ||
		object instanceof THREE.Sprite
	) {
		disposeMesh(object);
	} else if (
		object instanceof THREE.AmbientLight ||
		object instanceof THREE.DirectionalLight ||
		object instanceof THREE.HemisphereLight ||
		object instanceof THREE.Light ||
		object instanceof THREE.LightProbe ||
		object instanceof THREE.PointLight ||
		object instanceof THREE.RectAreaLight ||
		object instanceof THREE.SpotLight
	) {
		disposeLight(object);
	} else if (object instanceof THREE.AnimationMixer) {
		disposeMixer(object);
	} else if (
		object instanceof THREE.Audio ||
		object instanceof THREE.PositionalAudio
	) {
		disposeAudio(object);
	} else {
		console.warn(
			"[ThreeUtilities - disposeAnyObject()] - Didn't find any specific type",
			typeof object,
			object
		);
	}
};

// Automatic cleaning of everything in scene + renderer optionnaly
type DisposeAllInSceneType = (
	scene: THREE.Scene,
	renderer?: THREE.WebGLRenderer
) => void;
const disposeAllInScene: DisposeAllInSceneType = (scene, renderer) => {
	const objectToRemove: THREE.Object3D[] = [];

	scene.traverse((object) => {
		disposeAnyObject(object);

		objectToRemove.push(object);
	});

	objectToRemove.forEach((object) => {
		if (object.parent) {
			object.parent.remove(object);
		}
	});

	if (renderer) {
		disposeRenderer(renderer);
	}
};

/**
 * Camera utilities
 */

type getVisiblePlaneAtDistanceType = (
	camera: THREE.PerspectiveCamera,
	distanceZ: number
) => { width: number; height: number };
const getVisiblePlaneAtDistance: getVisiblePlaneAtDistanceType = (
	camera,
	distanceZ
) => {
	const fovInRadians = (camera.fov * Math.PI) / 180;
	const realDistanceZ = Math.abs(distanceZ - camera.position.z);

	const height = 2 * realDistanceZ * Math.tan(fovInRadians / 2);
	const width = height * camera.aspect;

	return { width, height };
};

/**
 * Animations utilities
 */

export type MappedAnimationsArrayType = Map<string, THREE.AnimationAction>;

type MapAnimationsNameAndClipType = (
	clips: THREE.AnimationClip[],
	animationMixer: THREE.AnimationMixer
) => MappedAnimationsArrayType;
const mapAnimationsNameAndClip: MapAnimationsNameAndClipType = (
	clips,
	animationMixer
) => {
	const mappedAnimations: MappedAnimationsArrayType = new Map();
	for (let clipIndex = 0; clipIndex < clips.length; clipIndex++) {
		const clip = clips[clipIndex];
		const clipName: string = clip.name.toLowerCase();
		const action = animationMixer.clipAction(clip);
		action.stop();
		mappedAnimations.set(clipName, action);
	}

	return mappedAnimations;
};

type ActionDatasType =
	| THREE.AnimationAction
	| {
			action: THREE.AnimationAction;
			from: number;
			to: number;
	  };

type ModifyActionStateType = (
	actionData: ActionDatasType,
	duration?: number,
	ease?: string,
	killTweens?: boolean
) => Promise<{ tween: GSAPTween; action: THREE.AnimationAction }>;
const beginAction: ModifyActionStateType = async (
	actionData,
	duration = 0.1,
	ease = 'quad.out',
	killTweens = true
) => {
	if (!gsap) {
		gsap = (await import('gsap')).default;
	}

	const action =
		actionData instanceof THREE.AnimationAction
			? actionData
			: actionData.action;
	const fromWeight =
		actionData instanceof THREE.AnimationAction ? 0 : actionData.from;
	const toWeight =
		actionData instanceof THREE.AnimationAction ? 1 : actionData.to;

	if (killTweens) {
		gsap.killTweensOf(action);
	}
	const tween = gsap.fromTo(
		action,
		{
			weight: fromWeight,
		},
		{
			weight: toWeight,
			duration,
			ease,
			onStart: () => {
				// action.reset();
				action.play();
			},
			onUpdate: () => {
				action.setEffectiveWeight(action.weight);
			},
		}
	);

	return { tween, action };
};

const endAction: ModifyActionStateType = async (
	actionData,
	duration = 0.1,
	ease = 'quad.out',
	killTweens = true
) => {
	if (!gsap) {
		gsap = (await import('gsap')).default;
	}

	const action =
		actionData instanceof THREE.AnimationAction
			? actionData
			: actionData.action;
	const fromWeight =
		actionData instanceof THREE.AnimationAction ? 1 : actionData.from;
	const toWeight =
		actionData instanceof THREE.AnimationAction ? 0 : actionData.to;

	if (killTweens) {
		gsap.killTweensOf(action);
	}
	const tween = gsap.fromTo(
		action,
		{
			weight: fromWeight,
		},
		{
			weight: toWeight,
			duration,
			ease,
			onUpdate: () => {
				action.setEffectiveWeight(action.weight);
			},
			onComplete: () => {
				action.stop();
			},
		}
	);

	return { tween, action };
};

type FadeToActionType = (
	nextAction: ActionDatasType | ActionDatasType[],
	currentAction?: THREE.AnimationAction,
	duration?: number,
	ease?: string
) => Promise<{ tween: GSAPTween; action: THREE.AnimationAction } | void>;
const fadeToAction: FadeToActionType = async (
	nextAction,
	currentAction,
	duration = 0.5,
	ease = 'quad.out'
) => {
	if (!gsap) {
		gsap = (await import('gsap')).default;
	}

	if (Array.isArray(nextAction) && nextAction.length > 1) {
		const lastActionData = nextAction[nextAction.length - 1];
		const lastAction =
			lastActionData instanceof THREE.AnimationAction
				? lastActionData
				: lastActionData.action;
		const timeline = gsap.timeline();
		let lastTween = null;
		let currentTime = 0;

		if (currentAction) {
			const { tween } = await endAction(
				currentAction,
				duration,
				ease,
				false
			);
			timeline.add(tween, currentTime);
		}

		for (
			let actionIndex = 0;
			actionIndex < nextAction.length;
			actionIndex++
		) {
			if (actionIndex > 0) {
				const { tween } = await endAction(
					nextAction[actionIndex - 1],
					duration,
					ease,
					false
				);
				timeline.add(tween, currentTime);
			}

			const actionData = nextAction[actionIndex];
			if (actionData && !(actionData instanceof THREE.AnimationAction)) {
				actionData.action.weight = 0;
				actionData.action.setEffectiveWeight(0);
				actionData.action.play();
			}
			const { tween: tweenStart } = await beginAction(
				nextAction[actionIndex],
				duration,
				ease,
				false
			);
			timeline.add(tweenStart, currentTime);

			if (actionIndex === nextAction.length - 1) {
				lastTween = tweenStart;
			}
			currentTime += duration;
		}

		if (lastTween) {
			return {
				tween: lastTween,
				action: lastAction,
			};
		}
	} else {
		const actionDatas = Array.isArray(nextAction)
			? nextAction[0]
			: nextAction;

		if (currentAction !== actionDatas) {
			if (currentAction) {
				await endAction(currentAction, duration, ease);
			}

			const { tween } = await beginAction(actionDatas, duration, ease);

			await tween.then(() => {
				return {
					tween,
					action:
						actionDatas instanceof THREE.AnimationAction
							? actionDatas
							: actionDatas.action,
				};
			});
		}
	}
};

const threeUtils = {
	loadAssets,
	disposeMaterial,
	disposeMesh,
	disposeLight,
	disposeMixer,
	disposeAudio,
	disposeRenderer,
	disposeAnyObject,
	disposeAllInScene,
	mapAnimationsNameAndClip,
	beginAction,
	endAction,
	fadeToAction,
	getVisiblePlaneAtDistance,
};
export {
	loadAssets,
	disposeMaterial,
	disposeMesh,
	disposeLight,
	disposeMixer,
	disposeAudio,
	disposeRenderer,
	disposeAnyObject,
	disposeAllInScene,
	mapAnimationsNameAndClip,
	beginAction,
	endAction,
	fadeToAction,
	getVisiblePlaneAtDistance,
};
export default threeUtils;
