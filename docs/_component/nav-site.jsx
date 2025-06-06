/**
 * @import {ReactNode} from 'react'
 * @import {Item} from './sort.js'
 */

/**
 * @typedef Properties
 *   属性类型定义。
 * @property {string} name
 *   名称。
 * @property {Readonly<Item>} navigationTree
 *   导航树结构。
 */

import React from 'react'
import {config} from '../_config.js'
import {GitHub} from './icon/github.jsx'
import {Mdx} from './icon/mdx.jsx'
import {OpenCollective} from './icon/open-collective.jsx'
import {NavigationGroup} from './nav.jsx'

export function NavigationSiteSkip() {
  return (
    <a
      href="#start-of-navigation"
      id="start-of-content"
      className="skip-to-navigation"
    >
      跳转到导航
    </a>
  )
}

/**
 * @param {Readonly<Properties>} properties
 *   属性参数。
 * @returns {ReactNode}
 *   返回的React元素。
 */
export function NavigationSite(properties) {
  const {name, navigationTree} = properties

  return (
    <nav className="navigation" aria-label="站点导航">
      <div id="banner">立即停火！🕊️</div>
      <a
        href="#start-of-content"
        id="start-of-navigation"
        className="skip-to-content"
      >
        跳转到内容
      </a>
      <div className="navigation-primary">
        <a href="/" aria-current={name === '/' ? 'page' : undefined}>
          <h1>
            <Mdx />
          </h1>
        </a>
      </div>
      <div className="navigation-search">
        <div id="docsearch" />
      </div>
      <NavigationGroup
        className="navigation-secondary"
        items={navigationTree.children}
        name={name}
      />
      <ol className="navigation-tertiary">
        <li>
          <a href={config.gh.href}>
            <GitHub />
          </a>
        </li>
        <li className="navigation-show-big">
          <a href={config.oc.href}>
            <OpenCollective />
          </a>
        </li>
      </ol>
    </nav>
  )
}