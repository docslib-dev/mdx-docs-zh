/**
 * @import {ReactNode} from 'react'
 */

/**
 * @typedef Properties
 *   属性类型定义。
 * @property {string} color
 *   颜色值。
 * @property {number} year
 *   年份。
 */

import React from 'react'

const data = [6, 5, 2, 4.5, 1.5, 2.5, 2, 2.5, 1.5, 2.5, 3.5, 7]

/**
 * @param {Readonly<Properties>} properties
 *   组件属性。
 * @returns {ReactNode}
 *   返回的React元素。
 */
export function Chart(properties) {
  return (
    <div className="snowfall">
      {data.map(function (d) {
        return (
          <div
            key={d}
            className="snowfall-bar"
            style={{
              backgroundColor: properties.color,
              height: 'calc(' + d + ' * 0.5 * (1em + 1ex))'
            }}
          />
        )
      })}
    </div>
  )
}