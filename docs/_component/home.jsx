/**
 * @import {ReactNode} from 'react'
 * @import {Data} from 'vfile'
 * @import {Item} from './sort.js'
 */

/**
 * @typedef {Exclude<Data['meta'], undefined>} Meta
 *   元数据。
 *
 * @typedef Properties
 *   属性。
 * @property {string} name
 *   名称。
 * @property {ReactNode} children
 *   子元素。
 * @property {Item} navigationTree
 *   导航树。
 * @property {Meta} meta
 *   元数据。
 */

import React from 'react'
import {FootSite} from './foot-site.jsx'
import {NavigationSite, NavigationSiteSkip} from './nav-site.jsx'

/**
 * @param {Readonly<Properties>} properties
 *   属性。
 * @returns {ReactNode}
 *   元素。
 */
export function Home(properties) {
  const {children, meta, name, navigationTree} = properties

  return (
    <div className="page home">
      <NavigationSiteSkip />
      <main>
        {meta.schemaOrg ? (
          <script type="application/ld+json">
            {JSON.stringify(meta.schemaOrg)}
          </script>
        ) : undefined}
        <article>
          <div className="content body">{children}</div>
        </article>
        <FootSite />
      </main>
      <NavigationSite name={name} navigationTree={navigationTree} />
    </div>
  )
}