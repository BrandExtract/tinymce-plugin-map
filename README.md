# Map plugin for TinyMCE 4

Embed a static map into the content.

## Installation

* `bower|npm` `install https://github.com/BrandExtract/tinymce-plugin-map.git --save`
* Move to a folder under `tinymce/plugins` through build scripts.

## Configuration

```javascript
<script type="text/javascript">
tinymce.init({
    selector: "textarea",
    plugins: "media image map",
    toolbar: "image map",
    extended_valid_elements: "+iframe[src|width|height|name|align|class]"
});
</script>
```

## Development

### TL;DR

```bash
git clone https://github.com/BrandExtract/tinymce-plugin-map.git
cd tinymce-plugin-map
npm install
```

Edit the file, add and commit.

### Why not edit the file directly on GitHub

There is a `pre-commit` hook that is automatically installed after
`npm install` and generates the minified file and sourcemap. Therefore,
it is recommended that we checkout the repo and run `npm install` to
work on it, instead of editing the file directly through GitHub web.

Otherwise, we will need to generate the minified file and sourcemap.
