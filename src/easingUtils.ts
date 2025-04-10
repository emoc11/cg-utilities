type EasingFunctionType = (t: number) => number;

/**
 * QUAD
 */
const easeInQuad: EasingFunctionType = (t) => {
	return t * t;
};
const easeOutQuad: EasingFunctionType = (t) => {
	return 1 - (1 - t) * (1 - t);
};
const easeInOutQuad: EasingFunctionType = (t) => {
	if (t < 0.5) return easeInQuad(t * 2) / 2;
	return 1 - easeInQuad((1 - t) * 2) / 2;
};

/**
 * CUBIC
 */
const easeInCubic: EasingFunctionType = (t) => {
	return t * t * t;
};
const easeOutCubic: EasingFunctionType = (t) => {
	return 1 - Math.pow(1 - t, 3);
};
const easeInOutCubic: EasingFunctionType = (t) => {
	if (t < 0.5) return easeInCubic(t * 2) / 2;
	return 1 - easeInCubic((1 - t) * 2) / 2;
};

/**
 * QUART
 */
const easeInQuart: EasingFunctionType = (t) => {
	return t * t * t * t;
};
const easeOutQuart: EasingFunctionType = (t) => {
	return 1 - Math.pow(1 - t, 4);
};
const easeInOutQuart: EasingFunctionType = (t) => {
	if (t < 0.5) return easeInQuart(t * 2) / 2;
	return 1 - easeInQuart((1 - t) * 2) / 2;
};

/**
 * QUINT
 */
const easeInQuint: EasingFunctionType = (t) => {
	return t * t * t * t * t;
};
const easeOutQuint: EasingFunctionType = (t) => {
	return 1 - Math.pow(1 - t, 5);
};
const easeInOutQuint: EasingFunctionType = (t) => {
	if (t < 0.5) return easeInQuint(t * 2) / 2;
	return 1 - easeInQuint((1 - t) * 2) / 2;
};

/**
 * SINE
 */
const easeInSine: EasingFunctionType = (t) => {
	return 1 - Math.cos((t * Math.PI) / 2);
};
const easeOutSine: EasingFunctionType = (t) => {
	return Math.sin((t * Math.PI) / 2);
};
const easeInOutSine: EasingFunctionType = (t) => {
	return -(Math.cos(Math.PI * t) - 1) / 2;
};

/**
 * EXPO
 */
const easeInExpo: EasingFunctionType = (t) => {
	return t === 0 ? 0 : Math.pow(2, 10 * t - 10);
};
const easeOutExpo: EasingFunctionType = (t) => {
	return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
};
const easeInOutExpo: EasingFunctionType = (t) => {
	if (t === 0 || t === 1) return t;
	if (t < 0.5) return easeInExpo(t * 2) / 2;
	return 1 - easeInExpo((1 - t) * 2) / 2;
};

/**
 * CIRC
 */
const easeInCirc: EasingFunctionType = (t) => {
	return 1 - Math.sqrt(1 - t * t);
};
const easeOutCirc: EasingFunctionType = (t) => {
	return Math.sqrt(1 - Math.pow(t - 1, 2));
};
const easeInOutCirc: EasingFunctionType = (t) => {
	if (t < 0.5) return easeInCirc(t * 2) / 2;
	return 1 - easeInCirc((1 - t) * 2) / 2;
};

/**
 * BACK (avec overshoot configurable)
 */
type EasingBackFunctionType = (t: number, s: number) => number;
const easeInBack: EasingBackFunctionType = (t, s = 1.70158) => {
	return t * t * ((s + 1) * t - s);
};
const easeOutBack: EasingBackFunctionType = (t, s = 1.70158) => {
	t -= 1;
	return t * t * ((s + 1) * t + s) + 1;
};
const easeInOutBack: EasingBackFunctionType = (t, s = 1.70158) => {
	s *= 1.525;
	if (t < 0.5) return (t * 2 * (t * 2) * ((s + 1) * (t * 2) - s)) / 2;
	t = t * 2 - 2;
	return (t * t * ((s + 1) * t + s) + 2) / 2;
};

/**
 * ELASTIC (amplitude & period configurables)
 */
type EasingElasticFunctionType = (t: number, a: number, p: number) => number;
const easeInElastic: EasingElasticFunctionType = (t, a = 1, p = 0.3) => {
	if (t === 0 || t === 1) return t;
	const s = (p / (2 * Math.PI)) * Math.asin(1 / a);
	return -(
		a *
		Math.pow(2, 10 * (t - 1)) *
		Math.sin(((t - 1 - s) * (2 * Math.PI)) / p)
	);
};
const easeOutElastic: EasingElasticFunctionType = (t, a = 1, p = 0.3) => {
	if (t === 0 || t === 1) return t;
	const s = (p / (2 * Math.PI)) * Math.asin(1 / a);
	return (
		a * Math.pow(2, -10 * t) * Math.sin(((t - s) * (2 * Math.PI)) / p) + 1
	);
};
const easeInOutElastic: EasingElasticFunctionType = (t, a = 1, p = 0.45) => {
	if (t === 0 || t === 1) return t;
	const s = (p / (2 * Math.PI)) * Math.asin(1 / a);
	t *= 2;
	if (t < 1) {
		return (
			-0.5 *
			(a *
				Math.pow(2, 10 * (t - 1)) *
				Math.sin(((t - 1 - s) * (2 * Math.PI)) / p))
		);
	}
	return (
		a *
			Math.pow(2, -10 * (t - 1)) *
			Math.sin(((t - 1 - s) * (2 * Math.PI)) / p) *
			0.5 +
		1
	);
};

/**
 * BOUNCE
 */
const easeOutBounce: EasingFunctionType = (t) => {
	const n1 = 7.5625;
	const d1 = 2.75;

	if (t < 1 / d1) {
		return n1 * t * t;
	} else if (t < 2 / d1) {
		t -= 1.5 / d1;
		return n1 * t * t + 0.75;
	} else if (t < 2.5 / d1) {
		t -= 2.25 / d1;
		return n1 * t * t + 0.9375;
	} else {
		t -= 2.625 / d1;
		return n1 * t * t + 0.984375;
	}
};
const easeInBounce: EasingFunctionType = (t) => {
	return 1 - easeOutBounce(1 - t);
};
const easeInOutBounce: EasingFunctionType = (t) => {
	if (t < 0.5) return (1 - easeOutBounce(1 - 2 * t)) / 2;
	return (1 + easeOutBounce(2 * t - 1)) / 2;
};

/**
 * Export
 */
const easingUtils = {
	easeInQuad,
	easeOutQuad,
	easeInOutQuad,
	easeInCubic,
	easeOutCubic,
	easeInOutCubic,
	easeInQuart,
	easeOutQuart,
	easeInOutQuart,
	easeInQuint,
	easeOutQuint,
	easeInOutQuint,
	easeInSine,
	easeOutSine,
	easeInOutSine,
	easeInExpo,
	easeOutExpo,
	easeInOutExpo,
	easeInCirc,
	easeOutCirc,
	easeInOutCirc,
	easeInBack,
	easeOutBack,
	easeInOutBack,
	easeInElastic,
	easeOutElastic,
	easeInOutElastic,
	easeInBounce,
	easeOutBounce,
	easeInOutBounce,
};

export {
	easeInQuad,
	easeOutQuad,
	easeInOutQuad,
	easeInCubic,
	easeOutCubic,
	easeInOutCubic,
	easeInQuart,
	easeOutQuart,
	easeInOutQuart,
	easeInQuint,
	easeOutQuint,
	easeInOutQuint,
	easeInSine,
	easeOutSine,
	easeInOutSine,
	easeInExpo,
	easeOutExpo,
	easeInOutExpo,
	easeInCirc,
	easeOutCirc,
	easeInOutCirc,
	easeInBack,
	easeOutBack,
	easeInOutBack,
	easeInElastic,
	easeOutElastic,
	easeInOutElastic,
	easeInBounce,
	easeOutBounce,
	easeInOutBounce,
};

export default easingUtils;
