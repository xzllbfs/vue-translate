import { initMixin } from './init'
import { stateMixin } from './state'
import { renderMixin } from './render'
import { eventsMixin } from './events'
import { lifecycleMixin } from './lifecycle'
import { warn } from '../util/index'

// 此处不用 class 的原因是为了方便后续给Vue混入实例成员，在原型上挂载一些方法和属性
function Vue (options) {
  if (process.env.NODE_ENV !== 'production' &&
    !(this instanceof Vue)
  ) {
    warn('Vue is a constructor and should be called with the `new` keyword')
  }
  this._init(options)
}

// 注册 vm 的 _init() 方法，初始化vm
initMixin(Vue)
// 注册 vm 的 $data/$props/$set/$delete/$watch
stateMixin(Vue)
// 初始化事件($on/$once/$forceUpdate/$destroy)及相关方法
eventsMixin(Vue)
// 初始化生命周期相关的混入方法，_update/$forceUpdate/$destroy
lifecycleMixin(Vue)
// 混入 render，$nextTick/_render
renderMixin(Vue)

export default Vue
