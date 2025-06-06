/**
 * @import {ReactNode} from 'react'
 * @import {Data} from 'vfile'
 * @import {Item} from './sort.js'
 */

/**
 * @typedef Properties
 *   属性类型。
 * @property {string} name
 *   名称。
 * @property {Readonly<URL>} ghUrl
 *   GitHub URL。
 * @property {Readonly<Data['meta']> | undefined} [meta]
 *   元数据。
 * @property {Readonly<Item>} navigationTree
 *   导航树。
 * @property {ReactNode} children
 *   子元素。
 */

import React from 'react'
import {FootSite} from './foot-site.jsx'
import {NavigationSite, NavigationSiteSkip} from './nav-site.jsx'
import {sortItems} from './sort.js'

const dateTimeFormat = new Intl.DateTimeFormat('en', {dateStyle: 'long'})

/**
 * @param {Readonly<Properties>} properties
 *   属性参数。
 * @returns {ReactNode}
 *   返回的React元素。
 */
export function Layout(properties) {
  const {ghUrl, name, navigationTree} = properties
  const [self, parent] = findSelfAndParent(navigationTree) || []
  const navigationSortItems = parent
    ? parent.data.navigationSortItems
    : undefined
  const siblings = parent
    ? sortItems(
        parent.children,
        typeof navigationSortItems === 'string'
          ? navigationSortItems
          : undefined
      )
    : []
  const meta = (self ? self.data.meta : properties.meta) || {}
  const index = self ? siblings.indexOf(self) : -1
  const previous = index === -1 ? undefined : siblings[index - 1]
  const next = index === -1 ? undefined : siblings[index + 1]
  const metaAuthors = meta.authors || []
  const metaTime = (
    self
      ? accumulateReadingTime(self)
      : meta.readingTime
        ? Array.isArray(meta.readingTime)
          ? meta.readingTime
          : [meta.readingTime, meta.readingTime]
        : []
  ).map(function (d) {
    return d > 15 ? Math.round(d / 5) * 5 : Math.ceil(d)
  })
  /** @type {string | undefined} */
  let timeLabel

  if (metaTime.length > 1 && metaTime[0] !== metaTime[1]) {
    timeLabel = metaTime[0] + '-' + metaTime[1] + ' 分钟'
  } else if (metaTime[0]) {
    timeLabel = metaTime[0] + ' 分钟' + (metaTime[0] > 1 ? '' : '')
  }

  const up =
    parent && self && parent !== navigationTree ? (
      <div>
        <a href={parent.name}>{entryToTitle(parent)}</a>
        {' / '}
        <a href={name} aria-current="page">
          {entryToTitle(self)}
        </a>
      </div>
    ) : undefined

  const back = previous ? (
    <div>
      上一篇:
      <br />
      <a rel="prev" href={previous.name}>
        {entryToTitle(previous)}
      </a>
    </div>
  ) : undefined

  const forward = next ? (
    <div>
      下一篇:
      <br />
      <a rel="next" href={next.name}>
        {entryToTitle(next)}
      </a>
    </div>
  ) : undefined

  const edit = (
    <div>
      发现拼写错误？有其他建议？
      <br />
      <a href={ghUrl.href}>在GitHub上编辑此页面</a>
    </div>
  )

  const published =
    meta.published && typeof meta.published === 'object' ? (
      <>
        发布于{' '}
        <time dateTime={meta.published.toISOString()}>
          {dateTimeFormat.format(meta.published)}
        </time>
      </>
    ) : undefined

  const modified =
    meta.modified && typeof meta.modified === 'object' ? (
      <>
        修改于{' '}
        <time dateTime={meta.modified.toISOString()}>
          {dateTimeFormat.format(meta.modified)}
        </time>
      </>
    ) : undefined

  const date =
    published || modified ? (
      <div>
        {published}
        {published && modified ? <br /> : undefined}
        {modified}
      </div>
    ) : undefined

  const readingTime = timeLabel ? <>{timeLabel} 阅读时长</> : undefined

  const creditsList = metaAuthors.map(function (d, i) {
    const href = d.github
      ? 'https://github.com/' + d.github
      : d.url || undefined
    return (
      <span key={d.name}>
        {i ? ', ' : ''}
        {href ? <a href={href}>{d.name}</a> : d.name}
      </span>
    )
  })

  const credits = creditsList.length > 0 ? <>作者：{creditsList}</> : undefined

  const info =
    readingTime || credits ? (
      <>
        {readingTime}
        {readingTime && credits ? <br /> : undefined}
        {credits}
      </>
    ) : undefined

  const header =
    up || info ? (
      <div className="block article-row">
        {up ? <div className="article-row-start">{up}</div> : undefined}
        {info ? <div className="article-row-end">{info}</div> : undefined}
      </div>
    ) : undefined

  const tail =
    edit || date ? (
      <div className="block article-row">
        {edit ? <div className="article-row-start">{edit}</div> : undefined}
        {date ? <div className="article-row-end">{date}</div> : undefined}
      </div>
    ) : undefined

  const footer =
    back || forward ? (
      <div className="block article-row">
        {back ? <div className="article-row-start">{back}</div> : undefined}
        {forward ? <div className="article-row-end">{forward}</div> : undefined}
      </div>
    ) : undefined

  return (
    <div className="page doc">
      <NavigationSiteSkip />
      <main>
        <article>
          {header ? (
            <header className="content">
              <div className="block head-article">{header}</div>
            </header>
          ) : undefined}
          <div className="content body">{properties.children}</div>
          {footer || tail ? (
            <footer className="content">
              <div className="block foot-article">
                {footer}
                {tail}
              </div>
            </footer>
          ) : undefined}
        </article>
        <FootSite />
      </main>
      <NavigationSite name={name} navigationTree={navigationTree} />
    </div>
  )

  /**
   * @param {Item} item
   *   当前项。
   * @param {Item | undefined} [parent]
   *   父项（可选）。
   * @returns {[self: Item, parent: Item | undefined] | undefined}
   *   返回当前项及其父项。
   */
  function findSelfAndParent(item, parent) {
    if (item.name === name) return [item, parent]

    let index = -1

    while (++index < item.children.length) {
      const result = findSelfAndParent(item.children[index], item)

      if (result) return result
    }
  }
}

/**
 * @param {Item} d
 *   导航项。
 * @returns {string | undefined}
 *   返回标题文本。
 */
function entryToTitle(d) {
  return d.data.matter?.title || d.data.meta?.title || undefined
}

/**
 * @param {Item} d
 *   导航项。
 * @returns {[number, number] | [number] | []}
 *   返回阅读时间范围。
 */
function accumulateReadingTime(d) {
  const time = (d.data.meta || {}).readingTime
  /** @type {[number, number] | [number] | []} */
  const total = time ? (Array.isArray(time) ? time : [time, time]) : []

  let index = -1
  while (++index < d.children.length) {
    const childTime = accumulateReadingTime(d.children[index])
    if (childTime[0]) total[0] = (total[0] || 0) + childTime[0]
    if (childTime[1]) total[1] = (total[1] || 0) + childTime[1]
  }

  return total
}