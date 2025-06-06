/* @jsxRuntime automatic */
/* @jsxImportSource react */

/* eslint-disable unicorn/prefer-global-this */

/**
 * @import {Grammar} from '@wooorm/starry-night'
 * @import {Node as EstreeNode, Program} from 'estree'
 * @import {Nodes as HastNodes, Root as HastRoot} from 'hast'
 * @import {Nodes as MdastNodes, Root as MdastRoot} from 'mdast'
 * @import {
    MdxJsxAttribute,
    MdxJsxAttributeValueExpression,
    MdxJsxExpressionAttribute
 * } from 'mdast-util-mdx-jsx'
 * @import {MDXModule} from 'mdx/types.js'
 * @import {ReactNode} from 'react'
 * @import {FallbackProps} from 'react-error-boundary'
 * @import {PluggableList} from 'unified'
 * @import {Node as UnistNode} from 'unist'
 */

/**
 * @typedef DisplayProperties
 *   属性集
 * @property {Error} error
 *   错误对象
 *
 * @typedef EvalNok
 *   异常状态
 * @property {false} ok
 *   是否正常
 * @property {Error} value
 *   错误值
 *
 * @typedef EvalOk
 *   正常状态
 * @property {true} ok
 *   是否正常
 * @property {ReactNode} value
 *   返回值
 *
 * @typedef {EvalNok | EvalOk} EvalResult
 *   执行结果
 */

import {compile, nodeTypes, run} from '@mdx-js/mdx'
import {createStarryNight} from '@wooorm/starry-night'
import sourceCss from '@wooorm/starry-night/source.css'
import sourceJs from '@wooorm/starry-night/source.js'
import sourceJson from '@wooorm/starry-night/source.json'
import sourceMdx from '@wooorm/starry-night/source.mdx'
import sourceTs from '@wooorm/starry-night/source.ts'
import sourceTsx from '@wooorm/starry-night/source.tsx'
import textHtmlBasic from '@wooorm/starry-night/text.html.basic'
import textMd from '@wooorm/starry-night/text.md'
import {visit as visitEstree} from 'estree-util-visit'
import {toJsxRuntime} from 'hast-util-to-jsx-runtime'
import {useEffect, useState} from 'react'
import {Fragment, jsx, jsxs} from 'react/jsx-runtime'
import ReactDom from 'react-dom/client'
import {ErrorBoundary} from 'react-error-boundary'
import rehypeRaw from 'rehype-raw'
import remarkDirective from 'remark-directive'
import remarkFrontmatter from 'remark-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import {removePosition} from 'unist-util-remove-position'
import {visit} from 'unist-util-visit'
import {VFile} from 'vfile'

const sample = `# 你好，世界！

以下是JSX中的Markdown示例。

<div style={{backgroundColor: 'violet', padding: '1rem'}}>
  尝试将背景色改为\`tomato\`。
</div>`

/** @type {ReadonlyArray<Grammar>} */
const grammars = [
  sourceCss,
  sourceJs,
  sourceJson,
  sourceMdx,
  sourceTs,
  sourceTsx,
  textHtmlBasic,
  textMd
]

/** @type {Awaited<ReturnType<typeof createStarryNight>>} */
let starryNight

const editor = document.querySelector('#js-editor')

if (window.location.pathname === '/playground/' && editor) {
  const root = document.createElement('div')
  root.classList.add('playground')
  editor.after(root)
  init(root)
}

/**
 * @param {Element} main
 *   DOM元素
 * @returns {undefined}
 *   无返回值
 */
function init(main) {
  const root = ReactDom.createRoot(main)

  createStarryNight(grammars).then(
    /**
     * @returns {undefined}
     *   无返回值
     */
    function (x) {
      starryNight = x

      const missing = starryNight.missingScopes()
      if (missing.length > 0) {
        throw new Error('意外缺失必要作用域: `' + missing + '`')
      }

      root.render(<Playground />)
    }
  )
}

function Playground() {
  const [directive, setDirective] = useState(false)
  const [evalResult, setEvalResult] = useState(
    // 类型转换以便使用实际值
    /** @type {unknown} */ (undefined)
  )
  const [development, setDevelopment] = useState(false)
  const [frontmatter, setFrontmatter] = useState(false)
  const [gfm, setGfm] = useState(false)
  const [formatMarkdown, setFormatMarkdown] = useState(false)
  const [generateJsx, setGenerateJsx] = useState(false)
  const [math, setMath] = useState(false)
  const [outputFormatFunctionBody, setOutputFormatFunctionBody] =
    useState(false)
  const [positions, setPositions] = useState(false)
  const [raw, setRaw] = useState(false)
  const [show, setShow] = useState('result')
  const [value, setValue] = useState(sample)

  useEffect(
    function () {
      go().then(
        function (ok) {
          setEvalResult({ok: true, value: ok})
        },
        /**
         * @param {Error} error
         *   错误对象
         * @returns {undefined}
         *   无返回值
         */
        function (error) {
          setEvalResult({ok: false, value: error})
        }
      )

      async function go() {
        /** @type {PluggableList} */
        const recmaPlugins = []
        /** @type {PluggableList} */
        const rehypePlugins = []
        /** @type {PluggableList} */
        const remarkPlugins = []

        if (directive) remarkPlugins.unshift(remarkDirective)
        if (frontmatter) remarkPlugins.unshift(remarkFrontmatter)
        if (gfm) remarkPlugins.unshift(remarkGfm)
        if (math) remarkPlugins.unshift(remarkMath)
        if (raw) rehypePlugins.unshift([rehypeRaw, {passThrough: nodeTypes}])

        const file = new VFile({
          basename: formatMarkdown ? 'example.md' : 'example.mdx',
          value
        })

        if (show === 'esast') recmaPlugins.push([captureEsast])
        if (show === 'hast') rehypePlugins.push([captureHast])
        if (show === 'mdast') remarkPlugins.push([captureMdast])
        /** @type {UnistNode | undefined} */
        let ast

        await compile(file, {
          development: show === 'result' ? false : development,
          jsx: show === 'code' || show === 'esast' ? generateJsx : false,
          outputFormat:
            show === 'result' || outputFormatFunctionBody
              ? 'function-body'
              : 'program',
          recmaPlugins,
          rehypePlugins,
          remarkPlugins
        })

        if (show === 'result') {
          /** @type {MDXModule} */
          const result = await run(String(file), {
            Fragment,
            jsx,
            jsxs,
            baseUrl: window.location.href
          })

          return (
            <ErrorBoundary
              FallbackComponent={ErrorFallback}
              resetKeys={[value]}
            >
              <div className="playground-result">{result.default({})}</div>
            </ErrorBoundary>
          )
        }

        if (ast) {
          return (
            <pre>
              <code>
                {toJsxRuntime(
                  starryNight.highlight(
                    JSON.stringify(ast, undefined, 2),
                    'source.json'
                  ),
                  {Fragment, jsx, jsxs}
                )}
              </code>
            </pre>
          )
        }

        // `show === 'code'`
        return (
          <pre>
            <code>
              {toJsxRuntime(starryNight.highlight(String(file), 'source.js'), {
                Fragment,
                jsx,
                jsxs
              })}
            </code>
          </pre>
        )

        function captureMdast() {
          /**
           * @param {MdastRoot} tree
           *   语法树
           * @returns {undefined}
           *   无返回值
           */
          return function (tree) {
            const clone = structuredClone(tree)
            if (!positions) cleanUnistTree(clone)
            ast = clone
          }
        }

        function captureHast() {
          /**
           * @param {HastRoot} tree
           *   语法树
           * @returns {undefined}
           *   无返回值
           */
          return function (tree) {
            const clone = structuredClone(tree)
            if (!positions) cleanUnistTree(clone)
            ast = clone
          }
        }

        function captureEsast() {
          /**
           * @param {Program} tree
           *   语法树
           * @returns {undefined}
           *   无返回值
           */
          return function (tree) {
            const clone = structuredClone(tree)
            if (!positions) visitEstree(clone, removeFromEstree)
            ast = clone
          }
        }
      }
    },
    [
      development,
      directive,
      frontmatter,
      gfm,
      generateJsx,
      formatMarkdown,
      math,
      outputFormatFunctionBody,
      positions,
      raw,
      show,
      value
    ]
  )

  const scope = formatMarkdown ? 'text.md' : 'source.mdx'
  // 类型转换获取实际值
  const compiledResult = /** @type {EvalResult | undefined} */ (evalResult)
  /** @type {ReactNode | undefined} */
  let display

  if (compiledResult) {
    if (compiledResult.ok) {
      display = compiledResult.value
    } else {
      display = (
        <div>
          <p>无法编译代码：</p>
          <DisplayError error={compiledResult.value} />
        </div>
      )
    }
  }

  return (
    <>
      <form>
        <div className="playground-area">
          <div className="playground-inner">
            <div className="playground-draw">
              {toJsxRuntime(starryNight.highlight(value, scope), {
                Fragment,
                jsx,
                jsxs
              })}
              {/* textarea中的尾部空格会显示，但在white-space: pre-wrap的div中不会
          添加br元素使最后的换行显式化 */}
              {/\n[ \t]*$/.test(value) ? <br /> : undefined}
            </div>
            <textarea
              spellCheck="false"
              className="playground-write"
              value={value}
              rows={value.split('\n').length + 1}
              onChange={function (event) {
                setValue(event.target.value)
              }}
            />
          </div>
        </div>
        <div className="playground-controls">
          <fieldset>
            <legend>显示</legend>
            <label>
              <select
                name="show"
                onChange={function (event) {
                  setShow(event.target.value)
                }}
              >
                <option value="result">执行结果</option>
                <option value="code">编译代码</option>
                <option value="mdast">mdast (markdown)</option>
                <option value="hast">hast (html)</option>
                <option value="esast">esast (javascript)</option>
              </select>{' '}
            </label>
          </fieldset>
          <fieldset>
            <legend>插件</legend>
            <label>
              <input
                type="checkbox"
                name="directive"
                checked={directive}
                onChange={function () {
                  setDirective(!directive)
                }}
              />{' '}
              使用{' '}
              <a href="https://github.com/remarkjs/remark-directive">
                <code>remark-directive</code>
              </a>
            </label>
            <label>
              <input
                type="checkbox"
                name="frontmatter"
                checked={frontmatter}
                onChange={function () {
                  setFrontmatter(!frontmatter)
                }}
              />{' '}
              使用{' '}
              <a href="https://github.com/remarkjs/remark-frontmatter">
                <code>remark-frontmatter</code>
              </a>
            </label>
            <label>
              <input
                type="checkbox"
                name="gfm"
                checked={gfm}
                onChange={function () {
                  setGfm(!gfm)
                }}
              />{' '}
              使用{' '}
              <a href="https://github.com/remarkjs/remark-gfm">
                <code>remark-gfm</code>
              </a>
            </label>
            <label>
              <input
                type="checkbox"
                name="math"
                checked={math}
                onChange={function () {
                  setMath(!math)
                }}
              />{' '}
              使用{' '}
              <a href="https://github.com/remarkjs/remark-math">
                <code>remark-math</code>
              </a>
            </label>
            <label>
              <input
                type="checkbox"
                name="raw"
                checked={raw}
                onChange={function () {
                  setRaw(!raw)
                }}
              />{' '}
              使用{' '}
              <a href="https://github.com/rehypejs/rehype-raw">
                <code>rehype-raw</code>
              </a>
            </label>
          </fieldset>
          <fieldset>
            <legend>输入格式</legend>
            <label>
              <input
                type="radio"
                name="language"
                checked={!formatMarkdown}
                onChange={function () {
                  setFormatMarkdown(false)
                }}
              />{' '}
              MDX (<code>format: &apos;mdx&apos;</code>)
            </label>
            <label>
              <input
                type="radio"
                name="language"
                checked={formatMarkdown}
                onChange={function () {
                  setFormatMarkdown(true)
                }}
              />{' '}
              markdown (<code>format: &apos;markdown&apos;</code>)
            </label>
          </fieldset>

          <fieldset disabled={show === 'result'}>
            <legend>输出格式</legend>
            <label>
              <input
                type="radio"
                name="output-format"
                checked={outputFormatFunctionBody}
                onChange={function () {
                  setOutputFormatFunctionBody(true)
                }}
              />{' '}
              函数体 (
              <code>outputFormat: &apos;function-body&apos;</code>)
            </label>
            <label>
              <input
                type="radio"
                name="output-format"
                checked={!outputFormatFunctionBody}
                onChange={function () {
                  setOutputFormatFunctionBody(false)
                }}
              />{' '}
              程序 (<code>outputFormat: &apos;program&apos;</code>)
            </label>
          </fieldset>

          <fieldset disabled={show === 'result'}>
            <legend>开发模式</legend>
            <label>
              <input
                type="radio"
                name="development"
                checked={development}
                onChange={function () {
                  setDevelopment(true)
                }}
              />{' '}
              开发环境 (<code>development: true</code>)
            </label>
            <label>
              <input
                type="radio"
                name="development"
                checked={!development}
                onChange={function () {
                  setDevelopment(false)
                }}
              />{' '}
              生产环境 (<code>development: false</code>)
            </label>
          </fieldset>

          <fieldset disabled={show === 'result'}>
            <legend>JSX</legend>
            <label>
              <input
                type="radio"
                name="jsx"
                checked={generateJsx}
                onChange={function () {
                  setGenerateJsx(true)
                }}
              />{' '}
              保留JSX (<code>jsx: true</code>)
            </label>
            <label>
              <input
                type="radio"
                name="jsx"
                checked={!generateJsx}
                onChange={function () {
                  setGenerateJsx(false)
                }}
              />{' '}
              编译JSX (<code>jsx: false</code>)
            </label>
          </fieldset>

          <fieldset disabled={show === 'result' || show === 'code'}>
            <legend>语法树</legend>
            <label>
              <input
                type="checkbox"
                name="positions"
                checked={positions}
                onChange={function () {
                  setPositions(!positions)
                }}
              />{' '}
              显示树中的<code>position</code>属性
            </label>
          </fieldset>
        </div>
      </form>
      {display}
    </>
  )
}

/**
 *
 * @param {Readonly<FallbackProps>} properties
 *   属性集
 * @returns {ReactNode}
 *   元素
 */
function ErrorFallback(properties) {
  // type-coverage:ignore-next-line
  const error = /** @type {Error} */ (properties.error)
  return (
    <div role="alert">
      <p>出错了：</p>
      <DisplayError error={error} />
      <button type="button" onClick={properties.resetErrorBoundary}>
        重试
      </button>
    </div>
  )
}

/**
 * @param {DisplayProperties} properties
 *   属性集
 * @returns {ReactNode}
 *   元素
 */
function DisplayError(properties) {
  return (
    <pre>
      <code>
        {String(
          properties.error.stack
            ? properties.error.message + '\n' + properties.error.stack
            : properties.error
        )}
      </code>
    </pre>
  )
}

/**
 * @param {HastRoot | MdastRoot} node
 *   mdast或hast根节点
 * @returns {undefined}
 *   无返回值
 */
function cleanUnistTree(node) {
  removePosition(node, {force: true})
  visit(node, cleanUnistNode)
}

/**
 * @param {HastNodes | MdastNodes | MdxJsxAttribute | MdxJsxAttributeValueExpression | MdxJsxExpressionAttribute} node
 *   节点
 * @returns {undefined}
 *   无返回值
 */
function cleanUnistNode(node) {
  if (
    node.type === 'mdxJsxAttribute' &&
    'value' in node &&
    node.value &&
    typeof node.value === 'object'
  ) {
    cleanUnistNode(node.value)
  }

  if (
    'attributes' in node &&
    node.attributes &&
    Array.isArray(node.attributes)
  ) {
    for (const attribute of node.attributes) {
      removePosition(attribute, {force: true})
      cleanUnistNode(attribute)
    }
  }

  if (node.data && 'estree' in node.data && node.data.estree) {
    visitEstree(node.data.estree, removeFromEstree)
  }
}

/**
 * @param {EstreeNode} node
 *   estree节点
 * @returns {undefined}
 *   无返回值
 */
function removeFromEstree(node) {
  delete node.loc
  delete node.start
  delete node.end
  delete node.range
}