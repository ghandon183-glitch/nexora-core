self.__MIDDLEWARE_MATCHERS = [
  {
    "regexp": "^\\/demo\\/aether(?:\\/(_next\\/data\\/[^/]{1,}))?\\/_next\\/image(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/_next/image"
  },
  {
    "regexp": "^\\/demo\\/aether(?:\\/(_next\\/data\\/[^/]{1,}))?\\/demo\\/aether\\/index\\.html(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/demo/aether/index.html"
  },
  {
    "regexp": "^\\/demo\\/aether(?:\\/(_next\\/data\\/[^/]{1,}))?(?:\\/((?!api|_next|_vercel|.*\\..*).*))(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/((?!api|_next|_vercel|.*\\..*).*)"
  },
  {
    "regexp": "^\\/demo\\/aether(?:\\/(_next\\/data\\/[^/]{1,}))?\\/downloads(?:\\/((?:[^\\/#\\?]+?)(?:\\/(?:[^\\/#\\?]+?))*))?(\\.json|\\.rsc|\\.segments\\/.+\\.segment\\.rsc)?[\\/#\\?]?$",
    "originalSource": "/downloads/:path*"
  }
];self.__MIDDLEWARE_MATCHERS_CB && self.__MIDDLEWARE_MATCHERS_CB()