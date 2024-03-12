(function mapPlugin(tinymce) {
  "use strict";

  tinymce.PluginManager.requireLangPack("map");

  const SERVICES = ["google_staticmap", "google_embed"];
  SERVICES["google_staticmap"] = {
    name: "Google Static Map",
    api: "//maps.googleapis.com/maps/api/staticmap?",
    type: "img"
  };
  SERVICES["google_embed"] = {
    name: "Google Embed Map",
    api: "//www.google.com/maps/embed/v1/place?",
    type: "iframe"
  };
  const MARKER_REGEX = /^(?:color:)?([^|]*)(?:\|.*)?$/;

  function buildURL(url, params) {
    const pairs = [];
    let key, value;

    for (key in params) {
      value = params[key];
      if (value) {
        pairs.push(key + "=" + value);
      }
    }
    url += pairs.join("&");
    return url;
  }

  function buildMap(data, useInlineStyle) {
    const service = SERVICES[data.service || "google_staticmap"];
    if (!service) {
      return "";
    }
    const type = service.type;
    // So the service name is not built into the URL.
    delete data.service;

    const width = data.width;
    const height = data.height;

    data.size = width + "x" + height;
    if (data.scale) {
      data.scale = 2;
    }

    if (data.markers) {
      data.markers = data.markers.replace(MARKER_REGEX, "color:$1|" + data.center);
    }
    const location = data.center || data.q;

    if (type === "iframe") {
      data.q = data.center;
      delete data.center;
      delete data.markers;
      delete data.width;
      delete data.height;
      delete data.size;
      delete data.scale;
      delete data.format;
    }

    // If no key is provided, try to use key in setting if any.
    if (!data.key) {
      data.key = service.key || "";
    }

    let html = buildURL(service.api, data);
    html = "<" + type + " src='" + html + "'";
    html += " width='" + width + "' height='" + height + "'";
    if (type === "img") {
      html += " alt='Map of " + location + "' title='" + location + "'";
    }
    if (useInlineStyle) {
      html += " style='max-width:100%;height:auto'";
    }
    html += " />";
    return html;
  }

  /* PLUGIN */
  function Plugin(editor, url) {
    this.editor = editor;
    this.url = url;

    // Map default API key in settings for each services.
    SERVICES.forEach(function buildAPIKey(name) {
      const service = SERVICES[name];
      service.key = editor.options.get(name + "_api_key") || "";
    });

    this.formFields = [
      {
        type: "listbox",
        name: "service",
        label: "Map service",
        tooltip: "Available: Google.",
        items: SERVICES.map(function buildItems(service) {
          return { text: SERVICES[service].name, value: service };
        }),
      },
      {
        type: "input",
        name: "key",
        label: "API Key"
      },
      {
        type: "input",
        name: "center",
        label: "Location",
        tooltip: "This parameter takes a location as either a comma-separated {latitude,longitude} pair (e.g. '40.714728,-73.998672') or a string address (e.g. 'city hall, new york, ny') identifying a unique location on the face of the earth",
      },
      {
        type: "grid",
        columns: 2,
        items: [
          {
            type: "listbox",
            name: "zoom",
            label: "Zoom level",
            tooltip: "This parameter takes a numerical value corresponding to the zoom level of the region desired",
            items: ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20"].map(function buildItems(level) {
              return { text: level, value: level + "" };
            }),
          },
          {
            type: "listbox",
            name: "markers",
            label: "Marker",
            items: ["No marker", "black", "brown", "green", "purple", "yellow", "blue", "gray", "orange", "red", "white"].map(function buildItems(color, index) {
              const value = index === 0 ? "" : color;
              return { text: color, value: value };
            }),
          }
        ]
      },
      {
        type: "grid",
        columns: 2,
        items: [
          {
            type: "input",
            name: "width",
            label: "Width",
          },
          {
            type: "input",
            name: "height",
            label: "Height",
          }
        ]
      },
      {
        type: "checkbox",
        label: "Retina (2x)",
        name: "retina",
      },
      {
        type: "listbox",
        name: "maptype",
        label: "Map type",
        tooltip: "The map type to display. Default to roadmap.",
        items: ["roadmap", "satellite"].map(function buildItems(level) {
          return { text: level, value: level };
        }),
      },
      {
        type: "textarea",
        name: "style",
        label: "Style",
        tooltip: "Custom style to alter the presentation of a specific feature (roads, parks, and other features) of the map",
        multiline: true,
        rows: 3,
      },
      {
        type: "listbox",
        name: "format",
        label: "Format",
        tooltip: "JPEG typically provides greater compression, while GIF and PNG provide greater detail.",
        items: ["png8", "png32", "gif", "jpg", "jpg-baseline"].map(function buildItems(level) {
          return { text: level, value: level };
        }),
      }
    ];

    this.showDialog = this.showDialog.bind(this);
    this.init(editor, url);
  }

  Plugin.prototype.init = function init(editor, url) {
    const plugin = this;

    editor.addCommand("beInsertMap", function insert(ui, value, args) {
      editor.insertContent(buildMap(args));
    });

    const mapSVG = `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 296.999 296.999" xml:space="preserve" width="24px" height="24px">
    <g>
      <path d="M141.914,185.802c1.883,1.656,4.234,2.486,6.587,2.486c2.353,0,4.705-0.83,6.587-2.486 c2.385-2.101,58.391-52.021,58.391-103.793c0-35.842-29.148-65.002-64.977-65.002c-35.83,0-64.979,29.16-64.979,65.002 C83.521,133.781,139.529,183.701,141.914,185.802z M148.501,65.025c9.302,0,16.845,7.602,16.845,16.984 c0,9.381-7.543,16.984-16.845,16.984c-9.305,0-16.847-7.604-16.847-16.984C131.654,72.627,139.196,65.025,148.501,65.025z" fill="#333333"/>
      <path d="M273.357,185.773l-7.527-26.377c-1.222-4.281-5.133-7.232-9.583-7.232h-53.719c-1.942,2.887-3.991,5.785-6.158,8.699 c-15.057,20.23-30.364,33.914-32.061,35.41c-4.37,3.848-9.983,5.967-15.808,5.967c-5.821,0-11.434-2.117-15.81-5.969 c-1.695-1.494-17.004-15.18-32.06-35.408c-2.167-2.914-4.216-5.813-6.158-8.699h-53.72c-4.45,0-8.361,2.951-9.583,7.232 l-8.971,31.436l200.529,36.73L273.357,185.773z" fill="#333333"/>
      <path d="M296.617,267.291l-19.23-67.396l-95.412,80.098h105.06c3.127,0,6.072-1.467,7.955-3.963 C296.873,273.533,297.474,270.297,296.617,267.291z" fill="#333333"/>
      <path d="M48.793,209.888l-30.44-5.576L0.383,267.291c-0.857,3.006-0.256,6.242,1.628,8.738c1.883,2.496,4.828,3.963,7.955,3.963 h38.827V209.888z" fill="#333333"/>
      <polygon points="62.746,212.445 62.746,279.992 160.273,279.992 208.857,239.207" fill="#333333"/>
    </g>
    </svg>`;

    editor.ui.registry.addIcon("map", mapSVG);

    // Add a button that opens a window
    editor.ui.registry.addButton("map", {
      icon: "map",
      tooltip: "Insert/edit map",
      onAction: (_) => plugin.showDialog()
    });

    editor.ui.registry.addMenuItem("map", {
      icon: "map",
      text: "Map",
      onAction: (_) => plugin.showDialog(),
      context: "insert"
    });
  };

  Plugin.prototype.showDialog = function showDialog() {
    const plugin = this;
    const editor = this.editor;
    const dom = editor.dom;
    let params = {};
    let mapElement;

    // Parse the current map source for values to insert into
    // the dialog inputs.
    mapElement = editor.selection.getNode();

    if (mapElement) {
      let src = dom.getAttrib(mapElement, "src");
      if (!src) {
        src = dom.getAttrib(mapElement, "data-mce-p-src");
      }
      if (src.indexOf("//") === 0) {
        src = "https:" + src;
      }
      if (src.indexOf("http") === 0) {
        const srcURL = new URL(src);
        const searchParams = new URLSearchParams(srcURL.search);

        for (const [key, value] of searchParams) {
          params[key] = value;
        }
      }

      if (params.retina === "true") {
        params.retina = true;
      } else {
        params.retina = false;
      }

      if (!params.center) {
        // The selection is an embed iframe map with `q` instead of `center`.
        params.center = params.q || "";
      }

      params.service = "google_staticmap";
      SERVICES.forEach(function buildParams(name) {
        const service = SERVICES[name];
        if (src.indexOf(service.api) > -1) {
          params.service = name;
        }
      });

      if (params.markers) {
        params.markers = params.markers.replace(MARKER_REGEX, "$1");
      }

      params.width = dom.getAttrib(mapElement, "width");
      params.height = dom.getAttrib(mapElement, "height");
    }

    if (!params.width) {
      params.width = "400";
    }
    if (!params.height) {
      params.height = "300";
    }

    // Reset this so `.render` runs correctly.
    this.window = null;

    this.window = this.editor.windowManager.open({
      title: "Insert a map",
      size: "medium",
      initialData: params,
      body:
      {
        type: "panel",
        items: [
          {
            type: "grid",
            columns: 2,
            items: [
              {
                type: "panel",
                items: this.formFields,
              },
              {
                type: "htmlpanel",
                html: "<div id='map'></div>"
              }
            ]
          },
        ]
      },
      buttons: [
        {
          type: "cancel",
          name: "cancel",
          text: "Cancel"
        },
        {
          type: "submit",
          name: "save",
          text: "Save",
          primary: true
        }
      ],
      onChange: function onChange(api) {
        plugin.render();
      },
      onSubmit: function onSubmit(api) {
        plugin.onsubmit();
        api.close();
      }
    });

    this.render();
  };

  Plugin.prototype.onsubmit = function onSubmit(event) {
    const window = this.window;
    // Insert content when the window form is submitted
    const data = window.getData();
    this.editor.insertContent(buildMap(data));
  };

  Plugin.prototype.render = function render(event) {
    const data = this.window.getData();
    let html = "";
    if (data["key"] === "") {
      html = "<div class='error'>Please enter a Google Maps API key.</div>";
    } else {
      html = buildMap(data, true);
    }

    const mapCtrl = $AM.find("#map")[0];
    mapCtrl.innerHTML = html;

    return html;
  };

  // Register plugin
  tinymce.PluginManager.add("map", (editor, url) => {
    const plugin = new Plugin(editor, url);

    return {
      getMetadata: () => ({
        name: "Map - Fully customizable map for your content.",
        url: "http://www.brandextract.com",
      })
    };
  });
})(window.tinymce);
