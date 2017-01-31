tinymce.PluginManager.add('gmaps', function(editor, url) {
  function buildURL(params) {
    var url = "//maps.googleapis.com/maps/api/staticmap?"
    var key, value, pairs = [];
    for (key in params) {
      value = params[key];
      if (value) {
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
  
  // Add a button that opens a window
  editor.addButton('gmaps', {
    image: 'data:image/svg+xml;utf8;base64,PD94bWwgdmVyc2lvbj0iMS4wIiBlbmNvZGluZz0iaXNvLTg4NTktMSI/Pgo8IS0tIEdlbmVyYXRvcjogQWRvYmUgSWxsdXN0cmF0b3IgMTkuMC4wLCBTVkcgRXhwb3J0IFBsdWctSW4gLiBTVkcgVmVyc2lvbjogNi4wMCBCdWlsZCAwKSAgLS0+CjxzdmcgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayIgdmVyc2lvbj0iMS4xIiBpZD0iTGF5ZXJfMSIgeD0iMHB4IiB5PSIwcHgiIHZpZXdCb3g9IjAgMCA1MTIgNTEyIiBzdHlsZT0iZW5hYmxlLWJhY2tncm91bmQ6bmV3IDAgMCA1MTIgNTEyOyIgeG1sOnNwYWNlPSJwcmVzZXJ2ZSIgd2lkdGg9IjE2cHgiIGhlaWdodD0iMTZweCI+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTM5NS4xMyw3Ny45MTNjLTIxLjQ3OCwwLTM4Ljk1NywxNy40NzgtMzguOTU3LDM4Ljk1N3MxNy40NzgsMzguOTU3LDM4Ljk1NywzOC45NTdzMzguOTU3LTE3LjQ3OCwzOC45NTctMzguOTU3ICAgIFM0MTYuNjA5LDc3LjkxMywzOTUuMTMsNzcuOTEzeiIgZmlsbD0iIzMzMzMzMyIvPgoJPC9nPgo8L2c+CjxnPgoJPGc+CgkJPHBhdGggZD0iTTM5NS4xMywwYy0zMS43MjEsMC02MC40NTMsMTIuODAxLTgxLjUzMiwzMy4zOTFIMTYuNjk2QzcuNDY3LDMzLjM5MSwwLDQwLjg1OSwwLDUwLjA4N3Y0MzguMjlsMzAwLjkzNC0zMDAuOTIxICAgIGwxNy4yODQsMjkuOTMzbC01MC4wOTksNTAuMDk5bDIxMC40OSwyMTAuNDY0VjIwNi4wMTVsMTcuNzcyLTMwLjc3N0M1MDYuNTg3LDE1Ny41OTgsNTEyLDEzNy40MTMsNTEyLDExNi44NyAgICBDNTEyLDUyLjQzNCw0NTkuNTY2LDAsMzk1LjEzLDB6IE0xNDQuNjk2LDIzMy43MzljLTM2LjgxNSwwLTY2Ljc4My0yOS45NjgtNjYuNzgzLTY2Ljc4M2MwLTM2LjgxNSwyOS45NjgtNjYuNzgzLDY2Ljc4My02Ni43ODMgICAgYzkuMDMyLDAsMTcuODA0LDEuNzkzLDI2LjAyMiw1LjI4MmM4LjQ3OCwzLjYyLDEyLjQyNCwxMy40MzQsOC44MDQsMjEuOTE0Yy0zLjYyLDguNDQ2LTEzLjM3LDEyLjQyNC0yMS45MTQsOC44MDQgICAgYy00LjA0My0xLjcyOS04LjQxMi0yLjYwOS0xMi45MTItMi42MDljLTE4LjQyNCwwLTMzLjM5MSwxNC45NjctMzMuMzkxLDMzLjM5MXMxNC45NjcsMzMuMzkxLDMzLjM5MSwzMy4zOTEgICAgYzEyLjMyNiwwLDIzLjExOS02LjcxNywyOC45MjQtMTYuNjk2aC0xMi4yMjhjLTkuMjI4LDAtMTYuNjk2LTcuNDY3LTE2LjY5Ni0xNi42OTZjMC05LjIyOCw3LjQ2Ny0xNi42OTYsMTYuNjk2LTE2LjY5NmgzMy4zOTEgICAgYzkuMjI4LDAsMTYuNjk2LDcuNDY3LDE2LjY5NiwxNi42OTZDMjExLjQ3OCwyMDMuNzcyLDE4MS41MTEsMjMzLjczOSwxNDQuNjk2LDIzMy43Mzl6IE00NjcuNDg5LDE1OC41NDNMMzk1LjEzLDI4My44MjYgICAgbC03Mi4zNTktMTI1LjI4M2MtNy4yNzItMTIuNTg2LTExLjExOS0yNi45OTktMTEuMTE5LTQxLjY3M2MwLTQ2LjA0MywzNy40MzUtODMuNDc4LDgzLjQ3OC04My40NzhzODMuNDc4LDM3LjQzNSw4My40NzgsODMuNDc4ICAgIEM0NzguNjA5LDEzMS41NDQsNDc0Ljc2MSwxNDUuOTU3LDQ2Ny40ODksMTU4LjU0M3oiIGZpbGw9IiMzMzMzMzMiLz4KCTwvZz4KPC9nPgo8Zz4KCTxnPgoJCTxwb2x5Z29uIHBvaW50cz0iMjQ0LjUwOSwyOTEuMDk1IDIzLjU5NCw1MTIgNDY1LjQ0MSw1MTIgICAiIGZpbGw9IiMzMzMzMzMiLz4KCTwvZz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8Zz4KPC9nPgo8L3N2Zz4K',
    tooltip: 'Insert/edit Google Maps',
    stateSelector: 'img[src*="maps.googleapis.com/maps"]',
    onclick: function() {
      var win, dom = editor.dom, imgElm;
      var params = {};
      
      // Parse the current map source for values to insert into
      // the dialog inputs.
      var imgElm = editor.selection.getNode();
      if (imgElm) {
        var uri = parseUri(dom.getAttrib(imgElm, 'src'));
        if (uri.queryKey) params = uri.queryKey;
        params.width = dom.getAttrib(imgElm, 'width');
        params.height = dom.getAttrib(imgElm, 'height');
      }
      
      // Open dialog window
      win = editor.windowManager.open({
        title: 'Insert a Google Maps',
        body: [
          {
            type: 'textbox', 
            name: 'center', 
            label: 'Center', 
            tooltip: 'This parameter takes a location as either a comma-separated {latitude,longitude} pair (e.g. "40.714728,-73.998672") or a string address (e.g. "city hall, new york, ny") identifying a unique location on the face of the earth',
            required: true,
            value: params.center
          },
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
            value: params.zoom
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
                value: params.width
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
                value: params.height
              },
              {
                name: 'scale', 
                type: 'checkbox',
                text: 'Retina (2x)',
                required: true,
                ariaLabel: 'Retina',
                checked: params.scale 
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
            value: params.maptype
          },
          {
            type: 'textbox',
            name: 'style',
            label: 'Style',
            ariaLabel: 'Style',
            tooltip: 'Custom style to alter the presentation of a specific feature (roads, parks, and other features) of the map',
            multiline: true,
            value: params.style
          },
          {
            type: 'listbox', 
            name: 'format', 
            label: 'Image Format',
            ariaLabel: 'Image Format',
            tooltip: 'JPEG typically provides greater compression, while GIF and PNG provide greater detail.',
            maxLength: 4,
            size: 2,
            values: ['png8', 'png32', 'gif', 'jpg', 'jpg-baseline'].map(function(level) {
              return { text: level, value: level }
            }),
            value: params.format
          },
        ],
        onsubmit: function(e) {
          var data = e.data;
          // Insert content when the window form is submitted
          data = tinymce.extend(data, {
            size: data.width + 'x' + data.height
          });
          if (data.scale) {
            data.scale = 2;
          }
          
          var url = buildURL(e.data);
          editor.insertContent('<img src="' + url + '" width="' + data.width + '" height="' + data.height + '" alt="Map of ' + e.data.center + '" title="' + data.center + '" />');
        }
      });
    },
    onpostrender: function() {
      var btn = this;
      editor.on('NodeChange', function(e) {

      });
    }
  });
});