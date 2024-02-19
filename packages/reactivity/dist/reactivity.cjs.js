'use strict';

exports.activeEffect = undefined; // 当前正在执行的effect 为了方便执行effect的时候依赖收集
function cleanupEffect(effect) {
    const { deps } = effect; // 清理effect  effect.deps = [newSet(),newSet(),newSet()]
    for (let i = 0; i < deps.length; i++) {
        deps[i].delete(effect);
    }
    effect.deps.length = 0;
}
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.fn = fn;
        this.scheduler = scheduler;
        this.active = true;
        this.deps = []; // 收集effect中使用到的属性
        // 默认会将fn挂载到类的实例上
        this.parent = undefined;
    }
    run() {
        try {
            if (!this.active) { // 不是激活状态
                return this.fn();
            }
            this.parent = exports.activeEffect; // 当前的effect就是他的父亲
            exports.activeEffect = this; // 设置成正在激活的是当前effect
            cleanupEffect(this); //清理副作用
            return this.fn();
        }
        finally {
            exports.activeEffect = this.parent; // 执行完毕后还原activeEffect
            this.parent = undefined;
        }
    }
    stop() {
        if (this.active) {
            cleanupEffect(this);
            this.active = false;
        }
    }
}
function effect(fn, options = {}) {
    // 创建一个响应式effect,并且让effect执行
    const _effect = new ReactiveEffect(fn, options.scheduler);
    _effect.run();
    const runner = _effect.run.bind(_effect);
    runner.effect = _effect;
    return runner; // 返回runner
}
// 进行依赖收集   targetMap 记录响应式对象 属性依赖的effect  每个effect记录依赖的
//                                               [targetMap]      [depsMap]            depSet
const targetMap = new WeakMap(); // 记录依赖关系  :{ reactiveObj1 : { reactiveObj1的属性： [ effect1...]   }  }
function track(target, type, key) {
    if (exports.activeEffect) {
        let depsMap = targetMap.get(target); // {对象：map}
        if (!depsMap) {
            targetMap.set(target, (depsMap = new Map())); // 初始化depsMap
        }
        let dep = depsMap.get(key); // 获取该属性被哪些effect收集  第一次为false
        if (!dep) {
            depsMap.set(key, (dep = new Set())); // 初始化该属性的依赖effect {对象：{ 属性 :[ dep, dep ]}}
        }
        trackEffects(dep); // 收集set中
    }
}
function trigger(target, type, key, newValue, oldValue) {
    const depsMap = targetMap.get(target); // 获取对应的映射表 {属性1：[effect1..],属性2:[effect2...] }
    if (!depsMap) { //没有被收集过直接返回
        return;
    }
    const effects = depsMap.get(key); // 查看该属性有没有被effect收集 | 查看该属性收集的effect
    triggerEffects(effects);
}
function triggerEffects(effects) {
    if (effects) {
        effects = [...effects]; // vue2中的是数组，先拷贝在魂环
        effects.forEach((effect) => {
            // 当前正在执行的和现在要执行的是同一个我就屏蔽掉
            if (exports.activeEffect !== effect) {
                if (effect.scheduler) { // 如果有调度函数则执行调度函数
                    effect.scheduler();
                }
                else {
                    effect.run();
                }
            }
        });
    }
}
function trackEffects(dep) {
    let shouldTrack = !dep.has(exports.activeEffect); //看是否应该被收集
    if (shouldTrack) {
        dep.add(exports.activeEffect); // 把当前活跃的efftct添加到属性的set种
        exports.activeEffect.deps.push(dep); //  activeEffect收集依赖属性所有的 Set([effect1...]) ，这样后续可以用于清理
    }
}

const isObject = (value) => {
    // return Object.prototype.toString.call(value) === '[object Object]';
    return value !== null && typeof value === 'object';
};
const isFunction = (value) => {
    return typeof value === "function";
};

function isRef(value) {
    return !!(value && value.__v_isRef);
}
function toReactive(value) {
    return isObject(value) ? reactive(value) : value;
}
// ref 处理的是基本类型
class RefImpl {
    constructor(rawValue, _shallow) {
        this.rawValue = rawValue;
        this._shallow = _shallow;
        this.dep = new Set();
        this.__v_isRef = true;
        this._value = _shallow ? rawValue : toReactive(rawValue); // 浅ref不需要再次代理
    }
    get value() {
        trackEffects(this.dep);
        return this._value;
    }
    set value(newVal) {
        if (newVal !== this.rawValue) {
            this.rawValue = newVal;
            this._value = this._shallow ? newVal : toReactive(newVal);
            triggerEffects(this.dep);
        }
    }
}
function createRef(rawValue, shallow) {
    return new RefImpl(rawValue, shallow); // 将值进行装包
}
// 将原始类型包装成对象, 同时也可以包装对象 进行深层代理
function ref(value) {
    return createRef(value, false);
}
// 创建浅ref 不会进行深层代理
function shallowRef(value) {
    return createRef(value, true);
}
class ObjectRefImpl {
    constructor(_object, _key) {
        this._object = _object;
        this._key = _key;
        this.__v_isRef = true;
    }
    get value() {
        return this._object[this._key];
    }
    set value(newVal) {
        this._object[this._key] = newVal;
    }
}
function toRef(object, key) {
    return new ObjectRefImpl(object, key);
}
function toRefs(object) {
    const ret = Array.isArray(object) ? new Array(object.length) : {};
    for (const key in object) {
        ret[key] = toRef(object, key);
    }
    return ret;
}
function proxyRefs(objectWithRefs) {
    return new Proxy(objectWithRefs, {
        get(target, key, receiver) {
            let v = Reflect.get(target, key, receiver);
            return v.__v_isRef ? v.value : v;
        },
        set(target, key, value, receiver) {
            const oldValue = target[key];
            if (oldValue.__v_isRef) {
                oldValue.value = value;
                return true;
            }
            else {
                return Reflect.set(target, key, value, receiver);
            }
        }
    });
}

const muableHandlers = {
    // receiver相当于代理对象
    get(target, key, receiver) {
        //取值的时候，让属性和effect产生关系
        if (key === "__v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return true;
        }
        const res = Reflect.get(target, key, receiver);
        track(target, 'get', key); // 依赖收集
        if (isRef(target[key])) {
            return target[key].value;
        }
        if (isObject(res)) {
            return reactive(res);
        }
        return res;
    },
    set(target, key, value, receiver) {
        // 等会赋值的时候可以重新触发effect执行
        let oldValue = target[key];
        const result = Reflect.set(target, key, value, receiver);
        if (oldValue !== value) {
            trigger(target, 'set', key);
        }
        return result;
    },
};

const reactiveMap = new WeakMap();
function reactive(target) {
    // reactive 只能处理对象类型的数据，不是对象不处理
    if (!isObject(target))
        return target;
    // 缓存可以采用映射表 {{target} -> proxy}
    let existingProxy = reactiveMap.get(target); // 看一下这个对象是否有被代理过
    if (existingProxy)
        return existingProxy; // 代理过直接返回
    //防止对象重复被代理
    if (target["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */]) {
        return target;
    }
    const proxy = new Proxy(target, muableHandlers); // 没有代理过创建代理
    reactiveMap.set(target, proxy); // 缓存代理结果
    // 1） 在vue3.0的时候 会创造一个反向映射表 {代理的结果 -》 原内容}
    // 2) 目前不用创建反向映射表，用的方式是，如果这个对象被代理过了说明已经被proxy拦截过了
    return proxy;
}
function isReactive(value) {
    return value["__v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}

// watch api 用法很多，常见写法就是监控一个函数的返回值，根据返回值的变化触发对应的函数
// watch = effect +包装   watchEffect = effect...
// = 深拷贝, seen防止死循环
function traverse(value, seen = new Set()) {
    if (!isObject(value)) {
        return value;
    }
    // 如果已经循环了这个对象，那么在循环会导致死循环
    if (seen.has(value)) {
        return value;
    }
    seen.add(value);
    for (const key in value) {
        traverse(value[key], seen); // 触发属性的hetter
    }
    return value;
}
function watch(source, cb, options) {
    return dowatch(source, cb);
}
function watchEffect(source, options) {
    return dowatch(source, null);
}
function dowatch(source, cb, options) {
    // 1）source是一个 响应式对象
    // 2）source是一个函数
    // effect() + scheduler
    let getter;
    if (isReactive(source)) {
        getter = () => traverse(source);
    }
    else if (isFunction(source)) {
        getter = source;
    }
    let oldVal;
    // 里面的属性就会收集当前的effect
    // 如果数据变化后会执行对应scheduler方法
    let clear;
    let onCleanup = (fn) => {
        clear = fn;
    };
    const job = () => {
        if (cb) {
            if (clear)
                clear(); // 下次执行的时候将上次的执行一下
            const newVal = effect.run();
            cb(newVal, oldVal, onCleanup);
            oldVal = newVal;
        }
        else {
            effect.run(); // watchEffect 只需要运行自身就可以了
        }
    };
    const effect = new ReactiveEffect(getter, job);
    oldVal = effect.run(); // 会让属性和effect关联在一起
}

class ComputedRefImpl {
    constructor(getter, setter) {
        this.setter = setter;
        this._dirty = true; // 做缓存
        this.__v_isRef = true; // 表示后续我们可以增加拆包的逻辑
        this.effect = new ReactiveEffect(getter, () => {
            if (!this._dirty) { // 依赖的值变化更新dirty并触发更新
                this._dirty = true;
                triggerEffects(this.dep);
            }
        });
    }
    get value() {
        if (exports.activeEffect) {
            trackEffects(this.dep || (this.dep = new Set));
        }
        if (this._dirty) { // 如果是脏值, 执行getter函数
            this._dirty = false;
            this._value = this.effect.run(); // this._value就是取值后的结果
        }
        return this._value;
    }
    set value(newValue) {
        this.setter(newValue);
    }
}
function computed(getterOrOptions) {
    let getter;
    let setter;
    const isGetter = isFunction(getterOrOptions); // 传入的是函数就是getter
    if (isGetter) {
        getter = getterOrOptions;
        setter = () => {
            console.log("warn");
        };
    }
    else {
        getter = getterOrOptions.get;
        setter = getterOrOptions.set;
    }
    // 创建计算属性
    return new ComputedRefImpl(getter, setter);
}

exports.ReactiveEffect = ReactiveEffect;
exports.computed = computed;
exports.dowatch = dowatch;
exports.effect = effect;
exports.isReactive = isReactive;
exports.isRef = isRef;
exports.proxyRefs = proxyRefs;
exports.reactive = reactive;
exports.ref = ref;
exports.shallowRef = shallowRef;
exports.toReactive = toReactive;
exports.toRef = toRef;
exports.toRefs = toRefs;
exports.track = track;
exports.trackEffects = trackEffects;
exports.trigger = trigger;
exports.triggerEffects = triggerEffects;
exports.watch = watch;
exports.watchEffect = watchEffect;
