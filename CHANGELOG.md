# Changelog

## 0.3.0
### Added
- Google Embed map.
- Input for API key
- Load API key from `${service}_api_key` setting.

### Changed
- Set default map dimensions to 400x300.
- Auto adjust live map preview container size.
- Changed minimum map dimension to 200px.
- Only support `roadmap` and `satellite` map types.
- Switched ownership to BrandExtract.

## 0.2.0 - 2016-02-01
### Added
- Language pack with `en` for now.
- Live preview of map.
- Checkbox to add marker to the center.
- Option to support different map services. Only Google for now.

### Changed
- Plugin renamed to just `maps`.
- New SVG icon.

## 0.1.0 - 2017-01-31
### Added
- TinyMCE plugin
- Toolbar button with base64 icon.
- Renders a static Google map into an `img` tag through inputs.
- Supports `center`, `zoom`, `size`, `scale`, `maptype`, `style`, `format`.
- Edit current Google static map.