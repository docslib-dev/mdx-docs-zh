import React from 'react'
import {config} from '../_config.js'

export function FootSite() {
  return (
    <footer className="foot-site">
      <div className="content">
        <div
          className="block"
          style={{display: 'flex', justifyContent: 'space-between'}}
        >
          <div>
            <small>
              MDX诞生于阿姆斯特丹、博伊西和全球各地 ❤️
            </small>
            <br />
            <small>本网站不会追踪您的行为</small>
            <br />
            <small>MIT 协议 © 2017-{new Date().getFullYear()}</small>
          </div>
          <div style={{marginLeft: 'auto', textAlign: 'right'}}>
            <small>
              项目托管于 <a href={config.gh.href}>GitHub</a>
            </small>
            <br />
            <small>
              文档托管于 <a href={new URL('docs/', config.ghTree).href}>GitHub</a>
            </small>
            <br />
            <small>
              更新订阅 <a href="/rss.xml">RSS源</a>
            </small>
            <br />
            <small>
              赞助支持 <a href={config.oc.href}>OpenCollective</a>
            </small>
          </div>
        </div>
      </div>
    </footer>
  )
}