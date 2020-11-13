/* @flow */

import { parse } from './parser/index'
import { optimize } from './optimizer'
import { generate } from './codegen/index'
import { createCompilerCreator } from './create-compiler'

// `createCompilerCreator` allows creating compilers that use alternative
// parser/optimizer/codegen, e.g the SSR optimizing compiler.
// Here we just export a default compiler using the default parts.
/**
 * @param template 模板
 * @param options 合并后的选项参数
 */
export const createCompiler = createCompilerCreator(function baseCompile (
  template: string,
  options: CompilerOptions
): CompiledResult {
  // 1. 把模板编译成抽象语法树 ast（用来以树形的方式描述代码结构，此处用来描述树形结构的HTML字符串）
  const ast = parse(template.trim(), options)
  if (options.optimize !== false) {
    // 2. 优化抽象语法树
    optimize(ast, options)
  }
  // 3. 把抽象语法树 转换成 字符串形式的 js 代码
  const code = generate(ast, options)
  return {
    // 抽象语法树
    ast,
    // 渲染函数
    render: code.render,
    // 静态渲染函数，生成静态 VNode 树
    staticRenderFns: code.staticRenderFns
  }
})
