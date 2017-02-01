(function() {
  tinymce.PluginManager.requireLangPack('maps');
  
  var SERVICES = {
    Google: '//maps.googleapis.com/maps/api/staticmap?'
  };
  
  function buildURL(params) {
    var url = SERVICES[params.service || 'Google'];
    
    var key, value, pairs = [];
    for (key in params) {
      value = params[key];
      if (key !== 'service' && value) {
        pairs.push(key + '=' + value);
      }
    }
    return url += pairs.join('&');
  }
  
  // parseUri 1.2.2
  // (c) Steven Levithan <stevenlevithan.com>
  // MIT License
  function parseUri (str) {
    var	o   = parseUri.options,
      m   = o.parser[o.strictMode ? "strict" : "loose"].exec(str),
      uri = {},
      i   = 14;
  
    while (i--) uri[o.key[i]] = m[i] || "";
  
    uri[o.q.name] = {};
    uri[o.key[12]].replace(o.q.parser, function ($0, $1, $2) {
      if ($1) uri[o.q.name][$1] = $2;
    });
  
    return uri;
  };
  
  parseUri.options = {
    strictMode: false,
    key: ["source","protocol","authority","userInfo","user","password","host","port","relative","path","directory","file","query","anchor"],
    q:   {
      name:   "queryKey",
      parser: /(?:^|&)([^&=]*)=?([^&]*)/g
    },
    parser: {
      strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      loose:  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*)(?::([^:@]*))?)?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/
    }
  };
  
  function buildMap(data, useInlineStyle) {
    data.size = data.width + 'x' + data.height;
    if (data.scale) {
      data.scale = 2;
    }

    if (data.markers) {
      data.markers = 'color:blue|' + data.center;
    }
    var html = buildURL(data);
    html = '<img src="' + html + '"';
    html += ' width="' + data.width + '" height="' + data.height + '"';
    html += ' alt="Map of ' + data.center + '" title="' + data.center + '"';
    if (useInlineStyle) {
      html += ' style="width: ' + data.width + 'px; height: ' + data.height + 'px;"';
    }
    html += ' />';
    return html;
  }
  
  /* PLUGIN */
  function Plugin(editor, url) {
    this.editor = editor;
    this.url = url;

    var render = this.render.bind(this);
    
    this.generalItems = [
      {
        type: 'listbox', 
        name: 'service', 
        label: 'Map service',
        ariaLabel: 'Map service',
        tooltip: 'Available: Google.',
        maxLength: 4,
        size: 2,
        values: ['Google'].map(function(level) {
          return { text: level, value: level }
        }),
        onchange: render
      },
      {
        type: 'textbox', 
        name: 'center', 
        label: 'Center', 
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
            values: [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20].map(function(level) {
              return { text: level, value: level + '' }
            }),
            onselect: render
          },
          {
            name: 'markers', 
            type: 'checkbox',
            text: 'Marker',
            required: true,
            ariaLabel: 'Marker',
            onchange: render
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
            min: 100, 
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
            min: 100,
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
        values: ['roadmap', 'satellite', 'hybrid', 'terrain'].map(function(level) {
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
        values: ['png8', 'png32', 'gif', 'jpg', 'jpg-baseline'].map(function(level) {
          return { text: level, value: level }
        }),
        onselect: render
      },
    ];
    
    this.init(editor, url);
  }
  
  Plugin.prototype.init = function(editor, url) {
    var plugin = this, generalItems = plugin.generalItems;
    // Add a button that opens a window
    editor.addButton('maps', {
      image: url + '/img/icons/map.svg',
      tooltip: 'Insert/edit map',
      stateSelector: 'img[src*="maps.googleapis.com/maps"]',
      onclick: function() {
        var dom = editor.dom, imgElm;
        var src = '';
        
        // Parse the current map source for values to insert into
        // the dialog inputs.
        var imgElm = editor.selection.getNode();
        if (imgElm) {
          src = dom.getAttrib(imgElm, 'src')
          var uri = parseUri(src);
          var params;
          if (uri.queryKey) {
            params = plugin.data = uri.queryKey;
          }
          params.width = dom.getAttrib(imgElm, 'width');
          params.height = dom.getAttrib(imgElm, 'height');
        }

        if (!params.width) params.width = 400;
        if (!params.height) params.height = 300;
        
        // Open dialog window
        plugin.showDialog();
      },
      onpostrender: function() {
        var btn = this;
        editor.on('NodeChange', function(e) {
  
        });
      }
    });
  }

  Plugin.prototype.showDialog = function() {
    var data = this.data;
    // Reset this so `.render` runs correctly.
    this.window = null;

    this.window = this.editor.windowManager.open({
      title: 'Insert a map',
      data: data,
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
              html: this.render()
            }
          ]
        }
      ],
      onsubmit: this.onsubmit.bind(this)
    });
  }
  
  Plugin.prototype.onsubmit = function(event) {
    var data = event.data;
    // Insert content when the window form is submitted
    data = tinymce.extend(data, {});
    this.editor.insertContent(buildMap(data));
  }

  Plugin.prototype.render = function(event) {
    var data = this.data || {}, html = buildMap(data, true);

    if (this.window) {
      this.window.find('*').each(function(ctrl) {
        data[ctrl.name()] = ctrl.value();
      });
      this.data = data;
      html = buildMap(data, true);
      this.window.find('#map')[0].getEl().innerHTML = html;
    }

    return html;
  }
  
  tinymce.create('tinymce.plugins.Maps', {
    init: function(editor, url) {
      new Plugin(editor, url);
    },
    getInfo: function () {
      return {
        longname: 'Maps - Fully customizable maps for your content.',
        author: 'Son Tran-Nguyen',
        authorurl: 'http://www.brandextract.com',
        version: '0.2.0'
      };
    }
  });
  
  // Register plugin
  tinymce.PluginManager.add('maps', tinymce.plugins.Maps);
})();