# Maps plugin for TinyMCE 4

Embed a static map into the content.

## Installation

* `bower|npm` `install https://github.com/sntran/tinymce-plugin-maps.git --save`
* Move to `tinymce/plugins` folder through build scripts.

## Configuration

```javascript
<script type="text/javascript">
tinymce.init({
    selector: "textarea",
    plugins: [
            "image maps"
            ],
    toolbar: "image maps",
    extended_valid_elements: "+iframe[src|width|height|name|align|class]",
    });
</script>
```