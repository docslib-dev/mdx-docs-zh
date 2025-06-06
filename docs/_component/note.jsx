/**
 * @import {ReactNode} from 'react'
 */

/**
 * @typedef {'important' | 'info' | 'legacy'} NoteType
 *   类型标识。
 *
 * @typedef Properties
 *   `Note`组件的属性定义。
 * @property {NoteType} type
 *   提示类型。
 * @property {Readonly<ReactNode>} children
 *   子节点。
 */

import React from 'react'

/** @type {Set<NoteType>} */
const known = new Set(['info', 'legacy', 'important'])

/**
 * @param {Readonly<Properties>} properties
 *   组件属性。
 * @returns {ReactNode}
 *   渲染元素。
 */
export function Note(properties) {
  const {children, type} = properties
  const className = ['note']

  if (known.has(type)) className.push(type)
  else {
    throw new Error('未知的提示类型 `' + type + '`')
  }

  return <div className={className.join(' ')}>{children}</div>
}