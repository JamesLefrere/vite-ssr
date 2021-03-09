import React from 'react'
import ReactDOMServer from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { ServerStyleSheet } from 'styled-components'
import { createUrl, getFullPath, withoutSuffix } from '../utils/route'

export default function (App, { base } = {}, hook) {
  const sheet = new ServerStyleSheet()

  return async function (url, { manifest, preload = false, ...extra } = {}) {
    url = createUrl(url)
    const routeBase = base && withoutSuffix(base({ url }), '/')
    const fullPath = getFullPath(url, routeBase)

    const context = { url, isClient: false, initialState: {}, ...extra }

    if (hook) {
      context.initialState =
        (await hook({ ...context })) || context.initialState
    }

    const helmetContext = {}

    const app = React.createElement(
      HelmetProvider,
      { context: helmetContext },
      React.createElement(
        StaticRouter,
        {
          basename: routeBase,
          location: fullPath,
        },
        React.createElement(App, context)
      )
    )

    const body = await ReactDOMServer.renderToString(sheet.collectStyles(app))

    const {
      htmlAttributes: htmlAttrs = '',
      bodyAttributes: bodyAttrs = '',
      ...tags
    } = helmetContext.helmet || {}

    const baseHeadTags = Object.keys(tags)
      .map((key) => (tags[key] || '').toString())

    const headTags = [...baseHeadTags, sheet.getStyleTags()]
      .join('')

    const initialState = JSON.stringify(context.initialState || {})

    return {
      // This string is replaced at build time
      // and injects all the previous variables.
      html: `__VITE_SSR_HTML__`,
      htmlAttrs,
      headTags,
      body,
      bodyAttrs,
      initialState,
      dependencies: [], // React does not populate the manifest context :(
    }
  }
}
