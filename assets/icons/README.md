# NoSnap.js Icons

This directory contains the official NoSnap.js library icons in various resolutions.

## Available Sizes

| Size | Filename | Use Case |
|------|----------|----------|
| 1024×1024 | `icon-1024.png` | High-resolution displays, app stores |
| 512×512 | `icon-512.png` | Large displays, documentation headers |
| 256×256 | `icon-256.png` | Medium displays, social media |
| 128×128 | `icon-128.png` | Standard displays, README headers |
| 64×64 | `icon-64.png` | Small displays, navigation |
| 32×32 | `icon-32.png` | Favicons, small UI elements |
| 16×16 | `icon-16.png` | Browser tabs, tiny UI elements |

## Usage Examples

### In HTML Documents

```html
<!-- Favicon -->
<link rel="icon" type="image/png" sizes="32x32" href="assets/icons/icon-32.png">
<link rel="icon" type="image/png" sizes="16x16" href="assets/icons/icon-16.png">

<!-- Apple Touch Icon -->
<link rel="apple-touch-icon" sizes="128x128" href="assets/icons/icon-128.png">

<!-- In content -->
<img src="assets/icons/icon-64.png" alt="NoSnap.js Logo" width="64" height="64">
```

### In Markdown

```markdown
![NoSnap.js Logo](assets/icons/icon-128.png)

<!-- Or with custom sizing -->
<img src="assets/icons/icon-64.png" alt="NoSnap.js Logo" width="32" height="32">
```

### In Documentation

- Use `icon-128.png` for README headers and main documentation
- Use `icon-64.png` for section headers and navigation
- Use `icon-32.png` and `icon-16.png` for favicons
- Use `icon-512.png` or `icon-1024.png` for high-resolution displays

## File Information

All icons are:
- **Format:** PNG with transparency (RGBA)
- **Quality:** High-resolution, optimized for web use
- **Compatibility:** Works across all modern browsers and devices
- **Source:** Generated from the original 1024×1024 master icon

## License

These icons are part of the NoSnap.js project and are subject to the same MIT license as the library.