import * as THREE from 'three';
import {
	easeOutQuad,
	beginAction,
	endAction,
	MappedAnimationsArrayType,
	mapAnimationsNameAndClip,
} from './index';

type ModelType = THREE.Group | THREE.Scene;

type AnimationKeyMapping = {
	action: string;
	keys: string[];
	movementSpeed: number;
	rotationSpeed: number;
	heightSpeed?: number;
	timeScale?: number;
};

export type CharacterControllerOptionsType = {
	model: ModelType;
	animations: THREE.AnimationClip[];
	keyMapping?: AnimationKeyMapping[];
	damping?: number;
	animationFadeTime?: number;
	airControlMovementFactor?: number;
	airControlRotationFactor?: number;
	gui?: any;
};

export class CharacterController {
	public options: {
		model: ModelType;
		animations: THREE.AnimationClip[];
		keyMapping: AnimationKeyMapping[];
		damping: number;
		animationFadeTime: number;
		airControlMovementFactor: number;
		airControlRotationFactor: number;
		gui?: any;
	};
	private model: ModelType;
	private mixer: THREE.AnimationMixer;
	private actions: MappedAnimationsArrayType;
	private activeActions: THREE.AnimationAction[] = [];
	private clock: THREE.Clock;
	private controls: Record<string, boolean>;
	private oldControls: Record<string, boolean>;
	private velocity: THREE.Vector3;
	private movementSpeed: number = 0;
	private rotationSpeed: number = 0;
	private idleActionName: string;
	private idleActionDatas: AnimationKeyMapping;

	private isJumping: boolean = false;
	private yVelocity: number = 0;
	private yVelocityMax: number = 1;
	private gravity: number = -20;
	private jumpDirection: THREE.Vector3 = new THREE.Vector3();

	constructor(options: CharacterControllerOptionsType) {
		this.options = {
			keyMapping: options.keyMapping ?? [
				{
					action: 'survey',
					keys: [],
					movementSpeed: 0,
					rotationSpeed: 0,
				},
				{
					action: 'jump',
					keys: ['Space'],
					movementSpeed: 0,
					rotationSpeed: 0,
					heightSpeed: 8,
				},
				{
					action: 'run',
					keys: ['KeyZ', 'ShiftLeft'],
					movementSpeed: 10,
					rotationSpeed: 0,
				},
				{
					action: 'run',
					keys: ['ArrowUp', 'ShiftLeft'],
					movementSpeed: 10,
					rotationSpeed: 0,
				},
				{
					action: 'walk',
					keys: ['KeyZ'],
					movementSpeed: 3,
					rotationSpeed: 0,
				},
				{
					action: 'walk',
					keys: ['ArrowUp'],
					movementSpeed: 3,
					rotationSpeed: 0,
				},
				{
					action: 'walk',
					keys: ['KeyS'],
					movementSpeed: -3,
					rotationSpeed: 0,
					timeScale: -1,
				},
				{
					action: 'walk',
					keys: ['ArrowDown'],
					movementSpeed: -3,
					rotationSpeed: 0,
					timeScale: -1,
				},
				{
					action: 'rotate',
					keys: ['KeyQ'],
					movementSpeed: 0,
					rotationSpeed: 1.5,
				},
				{
					action: 'rotate',
					keys: ['ArrowLeft'],
					movementSpeed: 0,
					rotationSpeed: 1.5,
				},
				{
					action: 'rotate',
					keys: ['KeyD'],
					movementSpeed: 0,
					rotationSpeed: -1.5,
				},
				{
					action: 'rotate',
					keys: ['ArrowRight'],
					movementSpeed: 0,
					rotationSpeed: -1.5,
				},
			],
			damping: 0.15,
			animationFadeTime: 0.5,
			airControlMovementFactor: 0.25,
			airControlRotationFactor: 1,
			...options,
		};

		this.model = this.options.model;
		this.mixer = new THREE.AnimationMixer(this.model);
		this.actions = mapAnimationsNameAndClip(
			this.options.animations,
			this.mixer
		);
		this.clock = new THREE.Clock();
		this.controls = {};
		this.oldControls = {};
		this.velocity = new THREE.Vector3();

		this.idleActionDatas = this.options.keyMapping.filter(
			(action) => action.keys.length === 0
		)[0];
		this.idleActionName = this.idleActionDatas.action;

		this.updateStateFromMapping();
		this.setupKeyboardControls();

		if (this.options.gui) {
			this.addGUIFolder(this.options.gui);
		}
	}

	private setupKeyboardControls() {
		window.addEventListener('keydown', (event) => {
			this.controls[event.code] = true;
			if (
				JSON.stringify(this.controls) !==
				JSON.stringify(this.oldControls)
			) {
				this.updateStateFromMapping();
			}
			this.oldControls = { ...this.controls };
		});

		window.addEventListener('keyup', (event) => {
			this.controls[event.code] = false;
			if (
				JSON.stringify(this.controls) !==
				JSON.stringify(this.oldControls)
			) {
				this.updateStateFromMapping();
			}
			this.oldControls = { ...this.controls };
		});
	}

	private getMinimalMovementSpeed(entries: AnimationKeyMapping[]): number {
		const candidates = entries
			.map((e) => e.movementSpeed)
			.filter((s) => s !== 0);
		if (candidates.length === 0) return 0;
		return candidates.reduce(
			(min, s) => (Math.abs(s) < Math.abs(min) ? s : min),
			candidates[0]
		);
	}

	private async setSingleAnimation(name: string, timescale = 1) {
		const newAction = this.actions.get(name.toLowerCase());
		if (!newAction) return;
		await this.stopAllAnimationsExcept(newAction);
		void beginAction(
			{ action: newAction, from: newAction.getEffectiveWeight(), to: 1 },
			this.options.animationFadeTime
		);
		newAction.timeScale = timescale ?? 1;
		this.activeActions = [newAction];
	}

	private async stopAllAnimationsExcept(keep?: THREE.AnimationAction) {
		for (const action of this.activeActions) {
			if (action !== keep) {
				await endAction(
					{ action, from: action.getEffectiveWeight(), to: 0 },
					this.options.animationFadeTime
				);
			}
		}
		this.activeActions = keep ? [keep] : [];
	}

	private updateStateFromMapping() {
		const pressedKeys = Object.keys(this.controls).filter(
			(k) => this.controls[k]
		);
		let activeEntries = this.options.keyMapping.filter((entry) =>
			entry.keys.every((key) => pressedKeys.includes(key))
		);

		if (pressedKeys.length === 0 || activeEntries.length === 0) {
			void this.setSingleAnimation(this.idleActionName);
			this.movementSpeed = this.idleActionDatas.movementSpeed;
			this.rotationSpeed = this.idleActionDatas.rotationSpeed;
			return;
		}

		const jumpEntry = activeEntries.filter(
			(e) => e.heightSpeed && e.heightSpeed > 0
		)[0];

		if (jumpEntry && jumpEntry.heightSpeed && !this.isJumping) {
			this.yVelocity = jumpEntry.heightSpeed;
			this.yVelocityMax = this.yVelocity;
			this.isJumping = true;

			const jumpForward = new THREE.Vector3(0, 0, 1)
				.applyEuler(this.model.rotation)
				.normalize();
			this.jumpDirection.copy(
				jumpForward.multiplyScalar(this.movementSpeed)
			);
			void this.setSingleAnimation(jumpEntry.action, jumpEntry.timeScale);
		}

		const mainEntry = activeEntries.reduce((a, b) =>
			a.keys.length >= b.keys.length &&
			this.actions.has(a.action.toLowerCase())
				? a
				: b
		);
		activeEntries = activeEntries.filter(
			(e) => !e.keys.some((key) => mainEntry.keys.includes(key))
		);
		activeEntries.unshift(mainEntry);

		void this.setBlendedAnimations(activeEntries);
		this.movementSpeed = this.getMinimalMovementSpeed(activeEntries);
		this.rotationSpeed = activeEntries.reduce(
			(sum, e) => sum + (e.rotationSpeed ?? 0),
			0
		);
	}

	private async setBlendedAnimations(entries: AnimationKeyMapping[]) {
		let validActions: THREE.AnimationAction[] = [];
		const filteredEntries = entries.filter((e) => e.keys.length > 0);
		for (const entry of filteredEntries) {
			const action = this.actions.get(entry.action.toLowerCase());
			if (!action) continue;
			action.timeScale = entry.timeScale ?? 1;
			validActions.push(action);
		}
		validActions = Array.from(new Set(validActions));
		const weight = 1 / validActions.length;
		for (const oldAction of this.activeActions) {
			if (!validActions.includes(oldAction)) {
				await endAction(
					{
						action: oldAction,
						from: oldAction.getEffectiveWeight(),
						to: 0,
					},
					this.options.animationFadeTime
				);
			}
		}
		for (const action of validActions) {
			void beginAction(
				{ action, from: action.getEffectiveWeight(), to: weight },
				this.options.animationFadeTime
			);
		}
		this.activeActions = validActions;
	}

	public addGUIFolder(folder: any) {
		const animationsObj: Record<string, () => void> = {};
		const animationsFolder = folder.addFolder('animations');
		this.actions.forEach((_value, name) => {
			animationsObj[name] = () => void this.setSingleAnimation(name);
			animationsFolder.add(animationsObj, name);
		});
	}

	public update() {
		const delta = this.clock.getDelta();
		const direction = new THREE.Vector3(0, 0, 1);
		if (this.rotationSpeed !== 0) {
			this.model.rotation.y += this.rotationSpeed * delta;
		}
		direction.applyEuler(this.model.rotation);
		this.velocity.lerp(
			direction.multiplyScalar(this.movementSpeed * delta),
			this.options.damping
		);

		if (this.isJumping) {
			const velocityNormalised = THREE.MathUtils.clamp(
				this.yVelocity / this.yVelocityMax,
				0,
				1
			);
			const easeValue = easeOutQuad(velocityNormalised);
			console.log('velocityNormalised', velocityNormalised);

			this.model.position.add(
				this.jumpDirection.clone().multiplyScalar(delta)
			);
			this.model.position.add(
				this.velocity
					.clone()
					.multiplyScalar(this.options.airControlMovementFactor)
			);

			if (this.rotationSpeed !== 0) {
				const sideDirection = new THREE.Vector3(1, 0, 0).applyEuler(
					this.model.rotation
				);
				this.model.position.add(
					sideDirection.multiplyScalar(
						this.rotationSpeed *
							delta *
							this.options.airControlRotationFactor
					)
				);
			}

			if (this.yVelocity > 0) {
				this.model.position.y += this.yVelocity * delta * easeValue;
			} else {
				this.model.position.y += this.yVelocity * delta;
			}

			this.yVelocity += this.gravity * delta;
		} else {
			this.model.position.add(this.velocity);
			this.model.position.y += this.yVelocity * delta;
		}

		if (this.model.position.y <= 0) {
			this.model.position.y = 0;
			this.yVelocity = 0;
			this.jumpDirection.set(0, 0, 0);
			if (this.isJumping) {
				this.isJumping = false;
				this.updateStateFromMapping();
			}
		}

		this.mixer.update(delta);
	}
}
