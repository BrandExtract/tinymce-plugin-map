(function (tinymce) {
  'use strict'

  tinymce.PluginManager.requireLangPack('map')

  var SERVICES = ['google_staticmap', 'google_embed']
  SERVICES['google_staticmap'] = {
    name: 'Google Static Map',
    api: '//maps.googleapis.com/maps/api/staticmap?',
    type: 'img'
  }
  SERVICES['google_embed'] = {
    name: 'Google Embed Map',
    api: '//www.google.com/maps/embed/v1/place?',
    type: 'iframe'
  }
  var MARKER_REGEX = /^(?:color:)?([^|]*)(?:\|.*)?$/

  function buildURL (url, params) {
    var key
    var value
    var pairs = []

    for (key in params) {
      value = params[key]
      if (value) {
        pairs.push(key + '=' + value)
      }
    }
    url += pairs.join('&')
    return url
  }

  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // MIT License
  function parseUri (str) {
    var o = parseUri.options
    var m = o.parser[o.strictMode ? 'strict' : 'loose'].exec(str)
    var uri = {}
    var i = 14

    while (i--) uri[o.key[i]] = m[i] || ''

    uri[o.q.name] = {}
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
      if ($1) uri[o.q.name][$1] = $2
    })

    return uri
  }

  parseUri.options = {
    strictMode: false,
    key: ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'anchor'],
    q: {
      name: 'queryKey',
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  }

  function buildMap (data, useInlineStyle) {
    var service = SERVICES[data.service || 'google_staticmap']
    if (!service) return ''
    var type = service.type
    // So the service name is not built into the URL.
    delete data.service

    var width = data.width
    var height = data.height

    data.size = width + 'x' + height
    if (data.scale) {
      data.scale = 2
    }

    if (data.markers) {
      data.markers = data.markers.replace(MARKER_REGEX, 'color:$1|' + data.center)
    }
    var location = data.center || data.q

    if (type === 'iframe') {
      data.q = data.center
      delete data.center
      delete data.markers
      delete data.width
      delete data.height
      delete data.size
      delete data.scale
      delete data.format
    }

    // If no key is provided, try to use key in setting if any.
    if (!data.key) {
      data.key = service.key || ''
    }

    var html = buildURL(service.api, data)
    html = '<' + type + ' src="' + html + '"'
    html += ' width="' + width + '" height="' + height + '"'
    if (type === 'img') {
      html += ' alt="Map of ' + location + '" title="' + location + '"'
    }
    if (useInlineStyle) {
      html += ' style="width: ' + width + 'px; height: ' + height + 'px;"'
    }
    html += ' />'
    return html
  }

  /* PLUGIN */
  function Plugin (editor, url) {
    this.editor = editor
    this.url = url

    // Map default API key in settings for each services.
    SERVICES.forEach(function (name) {
      var service = SERVICES[name]
      service.key = editor.settings[name + '_api_key'] || ''
    })

    var render = this.render.bind(this)

    this.generalItems = [
      {
        type: 'listbox',
        name: 'service',
        label: 'Map service',
        ariaLabel: 'Map service',
        tooltip: 'Available: Google.',
        maxLength: 4,
        size: 2,
        values: SERVICES.map(function (service) {
          return { text: SERVICES[service].name, value: service }
        }),
        onselect: render
      },
      {
        type: 'textbox',
        name: 'key',
        label: 'API Key',
        required: true,
        onchange: render
      },
      {
        type: 'textbox',
        name: 'center',
        label: 'Location',
        tooltip: 'This parameter takes a location as either a comma-separated {latitude,longitude} pair (e.g. "40.714728,-73.998672") or a string address (e.g. "city hall, new york, ny") identifying a unique location on the face of the earth',
        required: true,
        onchange: render
      },
      {
        type: 'container',
        layout: 'flex',
        direction: 'row',
        align: 'center',
        spacing: 20,
        label: 'Zoom',
        items: [
          {
            type: 'listbox',
            subtype: 'number',
            name: 'zoom',
            label: 'Zoom level',
            ariaLabel: 'Zoom',
            tooltip: 'This parameter takes a numerical value corresponding to the zoom level of the region desired',
            required: true,
            maxLength: 4,
            size: 2,
            min: 10,
            max: 20,
            values: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(function (level) {
              return { text: level, value: level + '' }
            }),
            onselect: render
          },
          {
            name: 'markers',
            type: 'listbox',
            subtype: 'text',
            label: 'Marker',
            ariaLabel: 'Marker',
            required: true,
            values: ['No marker', 'black', 'brown', 'green', 'purple', 'yellow', 'blue', 'gray', 'orange', 'red', 'white'].map(function (color, index) {
              var value = index === 0 ? '' : color
              return { text: color, value: value }
            }),
            flex: 1,
            onselect: render
          }
        ]
      },
      {
        type: 'container',
        label: 'Dimensions',
        layout: 'flex',
        direction: 'row',
        align: 'center',
        spacing: 5,
        items: [
          {
            name: 'width',
            type: 'textbox',
            subtype: 'number',
            maxLength: 5,
            size: 3,
            min: 200,
            max: 640,
            required: true,
            ariaLabel: 'Width',
            onchange: render
          },
          {type: 'label', text: 'x'},
          {
            name: 'height',
            type: 'textbox',
            subtype: 'number',
            maxLength: 5,
            size: 3,
            min: 200,
            max: 640,
            required: true,
            ariaLabel: 'Height',
            onchange: render
          },
          {
            name: 'scale',
            type: 'checkbox',
            text: 'Retina (2x)',
            required: true,
            ariaLabel: 'Retina',
            onchange: render
          }
        ]
      },
      {
        type: 'listbox',
        name: 'maptype',
        label: 'Map type',
        ariaLabel: 'Map type',
        tooltip: 'The map type to display. Default to roadmap.',
        maxLength: 4,
        size: 2,
        values: ['roadmap', 'satellite'].map(function (level) {
          return { text: level, value: level }
        }),
        onselect: render
      },
      {
        type: 'textbox',
        name: 'style',
        label: 'Style',
        ariaLabel: 'Style',
        tooltip: 'Custom style to alter the presentation of a specific feature (roads, parks, and other features) of the map',
        multiline: true,
        rows: 3,
        onchange: render
      },
      {
        type: 'listbox',
        name: 'format',
        label: 'Format',
        ariaLabel: 'Image Format',
        tooltip: 'JPEG typically provides greater compression, while GIF and PNG provide greater detail.',
        maxLength: 4,
        size: 2,
        values: ['png8', 'png32', 'gif', 'jpg', 'jpg-baseline'].map(function (level) {
          return { text: level, value: level }
        }),
        onselect: render
      }
    ]

    this.showDialog = this.showDialog.bind(this)
    this.init(editor, url)
  }

  Plugin.prototype.init = function (editor, url) {
    var plugin = this

    var stateSelector = SERVICES.map(function (name) {
      var service = SERVICES[name]
      var selector = service.type + '[src*="' + service.api + '"]'
      if (service.type === 'iframe') {
        // After inserting an iframe, TinyMCE wraps it with a span to handle clicks.
        // So we need to add a selector for it too.
        selector += ',' + '[data-mce-p-src*="' + service.api + '"]'
      }
      return selector
    }).join(',')

    // Add a button that opens a window
    editor.addButton('map', {
      image: url + '/img/icons/map.svg',
      tooltip: 'Insert/edit map',
      stateSelector: stateSelector,
      onclick: plugin.showDialog,
      onpostrender: function () {
        var btn = this
        editor.on('NodeChange', function (e) {
          btn
        })
      }
    })

    editor.addCommand('beInsertMap', function (ui, value, args) {
      editor.insertContent(buildMap(args))
    })

    editor.addMenuItem('map', {
      image: url + '/img/icons/map.svg',
      text: 'Map',
      onclick: plugin.showDialog,
      context: 'insert'
    })
  }

  Plugin.prototype.showDialog = function () {
    var editor = this.editor
    var dom = editor.dom
    var mapElement
    var params = this.data = {}

    // Parse the current map source for values to insert into
    // the dialog inputs.
    mapElement = editor.selection.getNode()

    if (mapElement) {
      var src = dom.getAttrib(mapElement, 'src')
      if (!src) {
        src = dom.getAttrib(mapElement, 'data-mce-p-src')
      }
      var uri = parseUri(src)
      if (uri.queryKey) {
        params = this.data = uri.queryKey
      }

      if (!params.center) {
        // The selection is an embed iframe map with `q` instead of `center`.
        params.center = params.q || ''
      }

      params.service = 'google_staticmap'
      SERVICES.forEach(function (name) {
        var service = SERVICES[name]
        if (src.indexOf(service.api) > -1) {
          params.service = name
        }
      })

      if (params.markers) {
        params.markers = params.markers.replace(MARKER_REGEX, '$1')
      }

      params.width = dom.getAttrib(mapElement, 'width')
      params.height = dom.getAttrib(mapElement, 'height')
    }

    if (!params.width) params.width = 400
    if (!params.height) params.height = 300

    // Reset this so `.render` runs correctly.
    this.window = null

    this.window = this.editor.windowManager.open({
      title: 'Insert a map',
      data: params,
      body: [
        {
          type: 'container',
          layout: 'grid',
          columns: 2,
          spacing: 20,
          alignH: ['left', 'right'],
          items: [
            {
              type: 'form',
              padding: 0,
              items: this.generalItems
            },
            {
              type: 'container',
              name: 'map',
              html: ''
            }
          ]
        }
      ],
      onsubmit: this.onsubmit.bind(this)
    })

    this.render()
  }

  Plugin.prototype.onsubmit = function (event) {
    var data = event.data
    // Insert content when the window form is submitted
    data = tinymce.extend(data, {})
    this.editor.insertContent(buildMap(data))
  }

  Plugin.prototype.render = function (event) {
    var data = this.data || {}
    var html = buildMap(data, true)
    var win = this.window

    if (win) {
      win.find('*').each(function (ctrl) {
        data[ctrl.name()] = ctrl.value()
      })
      this.data = data
      html = buildMap(data, true)
      var mapCtrl = win.find('#map')[0]
      mapCtrl.innerHtml(html).updateLayoutRect()

      mapCtrl.parentsAndSelf().each(function (ctrl) {
        ctrl.reflow()
      })
    }

    return html
  }

  tinymce.create('tinymce.plugins.Map', {
    init: function (editor, url) {
      return new Plugin(editor, url)
    },
    getInfo: function () {
      return {
        longname: 'Map - Fully customizable map for your content.',
        author: 'BrandExtract',
        authorurl: 'http://www.brandextract.com',
        version: '0.3.0'
      }
    }
  })

  // Register plugin
  tinymce.PluginManager.add('map', tinymce.plugins.Map)
})(window.tinymce)
