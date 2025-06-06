```markdown
// 增强 vfile 数据：
/// <reference types="rehype-infer-description-meta" />

/**
 * @import {ElementContent} from 'hast'
 * @import {ReactNode} from 'react'
 * @import {Item} from './sort.js'
 */

/**
 * @typedef ItemProperties
 *   `NavigationItem` 的属性。
 * @property {boolean | undefined} [includeDescription=false]
 *   是否包含描述（默认：`false`）。
 * @property {boolean | undefined} [includePublished=false]
 *   是否包含发布日期（默认：`false`）。
 * @property {Readonly<Item>} item
 *   条目。
 * @property {string | undefined} [name]
 *   名称。
 *
 * @typedef GroupOnlyProperties
 *   `NavigationGroup` 的属性；
 *   其他字段会传递给 `NavigationItem`。
 * @property {string | undefined} [className]
 *   类名。
 * @property {ReadonlyArray<Item>} items
 *   条目列表。
 * @property {string | undefined} [sort]
 *   排序字段。
 * @property {string | undefined} [name]
 *   名称。
 *
 * @typedef {Omit<ItemProperties, 'item'> & GroupOnlyProperties} GroupProperties
 *   `NavigationGroup` 的属性。
 */

import {apStyleTitleCase} from 'ap-style-title-case'
import {toJsxRuntime} from 'hast-util-to-jsx-runtime'
import React from 'react'
import {Fragment, jsx, jsxs} from 'react/jsx-runtime'
import {sortItems} from './sort.js'

const dateTimeFormat = new Intl.DateTimeFormat('en', {dateStyle: 'long'})

/**
 * @param {Readonly<GroupProperties>} properties
 *   属性。
 * @returns {ReactNode}
 *   元素。
 */
export function NavigationGroup(properties) {
  const {
    className,
    items,
    sort = 'navSortSelf,meta.title',
    ...rest
  } = properties

  return (
    <ol {...{className}}>
      {sortItems(items, sort).map(function (d) {
        return <NavigationItem key={d.name} {...rest} item={d} />
      })}
    </ol>
  )
}

/**
 * @param {Readonly<ItemProperties>} properties
 *   属性。
 * @returns {ReactNode}
 *   元素。
 */
export function NavigationItem(properties) {
  const {
    includeDescription,
    includePublished,
    item,
    name: activeName
  } = properties
  const {children, data = {}, name} = item
  const {matter = {}, meta = {}, navExcludeGroup, navigationSortItems} = data
  const title = matter.title || meta.title
  const defaultTitle = apStyleTitleCase(
    name.replace(/\/$/, '').split('/').pop()
  )
  /** @type {ReactNode} */
  let description
  /** @type {string | undefined} */
  let published

  if (includeDescription) {
    if (meta.descriptionHast) {
      // 类型断言，因为我们不期望文档类型。
      const children = /** @type {Array<ElementContent>} */ (
        meta.descriptionHast.children
      )

      description = toJsxRuntime(
        {
          type: 'element',
          tagName: 'div',
          properties: {className: ['nav-description']},
          children
        },
        {Fragment, jsx, jsxs}
      )
    } else {
      description = matter.description || meta.description || undefined

      description &&= (
        <div className="nav-description">
          <p>{description}</p>
        </div>
      )
    }
  }

  const pub = matter.published || meta.published

  if (includePublished && pub) {
    published = dateTimeFormat.format(
      typeof pub === 'string' ? new Date(pub) : pub || undefined
    )
  }

  return (
    <li>
      {title ? (
        <a href={name} aria-current={name === activeName ? 'page' : undefined}>
          {title}
        </a>
      ) : (
        defaultTitle
      )}
      {published ? ' — ' + published : undefined}
      {description || undefined}
      {!navExcludeGroup && children.length > 0 ? (
        <NavigationGroup
          items={children}
          sort={
            typeof navigationSortItems === 'string'
              ? navigationSortItems
              : undefined
          }
          name={activeName}
        />
      ) : undefined}
    </li>
  )
}
```