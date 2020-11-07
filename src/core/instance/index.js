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

// 1. Vue.prototype 上添加 _init() 方法，初始化vm
initMixin(Vue)
// 2. Vue.prototype 上添加 $data/$props/$set/$delete/$watch
stateMixin(Vue)
// 3. Vue.prototype 上添加 $on/$once/$off/$emit 及相关方法
eventsMixin(Vue)
// 4. 初始化生命周期相关的混入方法，_update/$forceUpdate/$destroy
lifecycleMixin(Vue)
// 5. 混入 render相关函数/$nextTick/_render
renderMixin(Vue)

export default Vue
