/* @flow */

// 导出DOM操作，对snabbdom的createElement等方法加工
import * as nodeOps from 'web/runtime/node-ops'
import { createPatchFunction } from 'core/vdom/patch'
// 处理指令 directives 和 ref 属性
import baseModules from 'core/vdom/modules/index'
// 平台相关的模块，导出create和update两个钩子函数
import platformModules from 'web/runtime/modules/index'

// the directive module should be applied last, after all
// built-in modules have been applied.
const modules = platformModules.concat(baseModules)

// createPatchFunction 创建patch函数（高阶函数，柯里化函数）
export const patch: Function = createPatchFunction({ nodeOps, modules })
