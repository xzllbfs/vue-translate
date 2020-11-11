/* @flow */

import Dep from './dep'
import VNode from '../vdom/vnode'
import { arrayMethods } from './array'
import {
  def,
  warn,
  hasOwn,
  hasProto,
  isObject,
  isPlainObject,
  isPrimitive,
  isUndef,
  isValidArrayIndex,
  isServerRendering
} from '../util/index'

const arrayKeys = Object.getOwnPropertyNames(arrayMethods)

/**
 * In some cases we may want to disable observation inside a component's
 * update computation.
 */
export let shouldObserve: boolean = true

export function toggleObserving (value: boolean) {
  shouldObserve = value
}

/**
 * 2. 对数组/对象做响应式处理
 * Observer class that is attached to each observed object.  Observer类被附加到每一个被观察的对象
 * Once attached, the observer converts the target 一旦附加 observer 会为
 * object's property keys into getter/setters that 目标对象中的每个属性添加 getter/setter
 * collect dependencies and dispatch updates. 用来收集依赖和派发更新（发送通知）
 */
export class Observer {
  // 观测对象
  value: any;
  // 依赖对象
  dep: Dep;
  // 实例计数器
  vmCount: number; // number of vms that have this object as root $data

  constructor (value: any) {
    this.value = value
    this.dep = new Dep()
    // 初始化实例的 vmCount 为 0
    this.vmCount = 0
    // 将实例挂载到观察对象的 __ob__ 属性上
    // def方法是对 Object.defineProperty 的封装，有4个形参
    // 最后一个形参是enumerable，observer对象不需要被遍历，所以不传（undefined转false）
    def(value, '__ob__', this)
    // 数组的响应式处理
    if (Array.isArray(value)) {
      // 判断对象中是否有 __proto__，浏览器是否兼容对象的原型属性
      if (hasProto) {
        // value.__proto__ = arrayMethods（修补了push/unshift/splice后的数组原型方法）
        protoAugment(value, arrayMethods)
      } else {
        // arrayKeys：获取修补后的数组原型方法名字
        copyAugment(value, arrayMethods, arrayKeys)
      }
      // 为数组中的每一个对象创建一个 observer 实例
      this.observeArray(value)
    } else {
      // 编译对象的每一个属性，转换成 setter/getter
      this.walk(value)
    }
  }

  /**
   * Walk through all properties and convert them into
   * getter/setters. This method should only be called when
   * value type is Object.
   */
  walk (obj: Object) {
    const keys = Object.keys(obj)
    for (let i = 0; i < keys.length; i++) {
      // 把属性转换为 getter和setter
      defineReactive(obj, keys[i])
    }
  }

  /**
   * Observe a list of Array items.
   * 对数组做响应式处理
   */
  observeArray (items: Array<any>) {
    for (let i = 0, l = items.length; i < l; i++) {
      observe(items[i])
    }
  }
}

// helpers

/**
 * Augment a target Object or Array by intercepting
 * the prototype chain using __proto__
 */
function protoAugment (target, src: Object) {
  /* eslint-disable no-proto */
  target.__proto__ = src
  /* eslint-enable no-proto */
}

/**
 * Augment a target Object or Array by defining
 * hidden properties.
 */
/* istanbul ignore next */
function copyAugment (target: Object, src: Object, keys: Array<string>) {
  for (let i = 0, l = keys.length; i < l; i++) {
    const key = keys[i]
    def(target, key, src[key])
  }
}

/**
 * 1. 响应式入口函数,将数据转换为响应式的
 * Attempt to create an observer instance for a value, 试图创建一个 observer 对象赋值给value
 * returns the new observer if successfully observed, 如果创建成功返回 新的observer 对象
 * or the existing observer if the value already has one. 或者返回已经存在的对象
 */
export function observe (value: any, asRootData: ?boolean): Observer | void {
  // 判断 value 是否为对象
  if (!isObject(value) || value instanceof VNode) {
    return
  }
  let ob: Observer | void
  // 如果 value 有 _ob_ 属性，并且这个属性是 Observer 的实例，将属性赋值给 ob
  if (hasOwn(value, '__ob__') && value.__ob__ instanceof Observer) {
    ob = value.__ob__
  } else if (
    shouldObserve &&
    !isServerRendering() &&
    (Array.isArray(value) || isPlainObject(value)) &&
    Object.isExtensible(value) &&
    !value._isVue // value 是否为 vue 实例
  ) {
    // 创建一个 Observer 对象
    ob = new Observer(value)
  }
  if (asRootData && ob) {
    // 如果是 响应式 根数据
    ob.vmCount++
  }
  return ob
}

/**
 * Define a reactive property on an Object.
 * 为对象定义一个响应式属性
 * @param shallow 是否深度监听
 */
export function defineReactive (
  obj: Object,
  key: string,
  val: any,
  customSetter?: ?Function,
  shallow?: boolean
) {
  // 为当前属性添加依赖，获取这个观察这个属性的所有Watcher
  const dep = new Dep()
  // 获取 obj 的属性描述符对象
  const property = Object.getOwnPropertyDescriptor(obj, key)
  // 如果当前属性不可配置，即不可以通过delte删除，也不可以使用Object.defineProperty定义，直接返回
  if (property && property.configurable === false) {
    return
  }

  // 提供预定义的存取器函数
  // cater for pre-defined getter/setters
  const getter = property && property.get
  const setter = property && property.set
  // 如果没有定义存取器，获取对象的所有属性
  if ((!getter || setter) && arguments.length === 2) {
    val = obj[key]
  }

  // 判断如果递归观察子对象（深度监听），将子对象属性都转换成 getter/setter 并返回
  let childOb = !shallow && observe(val)
  Object.defineProperty(obj, key, {
    enumerable: true,
    configurable: true,
    get: function reactiveGetter () {
      // 如果预定义的 getter(property.get) 存在，则value等于getter调用的返回值，否则直接赋属性值
      const value = getter ? getter.call(obj) : val
      // 如果存在当前依赖目标，即Watcher对象，则建立依赖
      if (Dep.target) {
        // 建立依赖，将 Dep 添加到 Watcher.newDeps 中，将 Watcher 添加到 Dep.subs 中
        dep.depend()
        // 建立子对象的依赖关系
        if (childOb) {
          childOb.dep.depend()
          // 如果属性是数组，特殊处理收集数组对象依赖
          if (Array.isArray(value)) {
            dependArray(value)
          }
        }
      }
      // 返回属性值
      return value
    },
    set: function reactiveSetter (newVal) {
      const value = getter ? getter.call(obj) : val
      /* eslint-disable no-self-compare */
      // 如果新值和旧值相等，或者新值旧值都为 NaN 则不执行
      if (newVal === value || (newVal !== newVal && value !== value)) {
        return
      }
      /* eslint-enable no-self-compare */
      if (process.env.NODE_ENV !== 'production' && customSetter) {
        customSetter()
      }
      // #7981: for accessor properties without setter
      // 只读属性不做赋值处理
      if (getter && !setter) return
      // 如果预定义 setter 存在则调用，否则直接更新新值
      if (setter) {
        setter.call(obj, newVal)
      } else {
        val = newVal
      }
      // 如果新值是对象，观察子对象并返回子的 observer 对象
      childOb = !shallow && observe(newVal)
      // 派发更新（发布更改通知）
      dep.notify()
    }
  })
}

/**
 * Set a property on an object. Adds the new property and
 * triggers change notification if the property doesn't
 * already exist.
 */
export function set (target: Array<any> | Object, key: any, val: any): any {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot set reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 判断 target 是否为数组，key 是否是合法的索引
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    target.length = Math.max(target.length, key)
    // 通过 splice 对 key 位置的元素进行替换
    // splice 在 array.js 进行了响应式处理
    target.splice(key, 1, val)
    return val
  }
  // 如果 key 在对象中已经存在直接赋值
  if (key in target && !(key in Object.prototype)) {
    target[key] = val
    return val
  }
  // 获取目标数据 target 的响应式 observer 对象
  const ob = (target: any).__ob__
  // 如果 target 是 vue 实例或者 $data 直接返回，$data上的ob.vmCount = 1，其它等于0
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid adding reactive properties to a Vue instance or its root $data ' +
      'at runtime - declare it upfront in the data option.'
    )
    return val
  }
  // 如果目标数据 target 不是响应式对象，不做响应式处理
  if (!ob) {
    target[key] = val
    return val
  }
  // 把 key 设置为响应式属性：挂载到 target上，并设置 getter/setter
  defineReactive(ob.value, key, val)
  // 发送通知，收集依赖的时候会给子属性添加依赖
  ob.dep.notify()
  return val
}

/**
 * Delete a property and trigger change if necessary.
 */
export function del (target: Array<any> | Object, key: any) {
  if (process.env.NODE_ENV !== 'production' &&
    (isUndef(target) || isPrimitive(target))
  ) {
    warn(`Cannot delete reactive property on undefined, null, or primitive value: ${(target: any)}`)
  }
  // 判断 target 是否为数组，key 是否是合法的索引
  if (Array.isArray(target) && isValidArrayIndex(key)) {
    // 如果时数组，通过做过响应式处理的splice删除
    target.splice(key, 1)
    return
  }
  // 获取 target 的 ob 对象
  const ob = (target: any).__ob__
  // 如果 target 是 vue 实例或者 $data 直接返回，$data上的ob.vmCount = 1，其它等于0
  if (target._isVue || (ob && ob.vmCount)) {
    process.env.NODE_ENV !== 'production' && warn(
      'Avoid deleting properties on a Vue instance or its root $data ' +
      '- just set it to null.'
    )
    return
  }
  // 如果 target 对象没有 key 属性，直接返回
  if (!hasOwn(target, key)) {
    return
  }
  // 删除属性
  delete target[key]
  // 如果目标数据 target 不是响应式对象，不做响应式处理
  if (!ob) {
    return
  }
  // 发送通知，收集依赖的时候会给子属性添加依赖
  ob.dep.notify()
}

/**
 * Collect dependencies on array elements when the array is touched, since
 * we cannot intercept array element access like property getters.
 */
function dependArray (value: Array<any>) {
  for (let e, i = 0, l = value.length; i < l; i++) {
    e = value[i]
    // 如果数组中的元素是对象，也会对对象收集依赖
    e && e.__ob__ && e.__ob__.dep.depend()
    if (Array.isArray(e)) {
      dependArray(e)
    }
  }
}
