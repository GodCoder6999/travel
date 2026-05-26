# Earth textures (drop these in)

Voyage's Hero globe checks for these files. If missing, it falls back to the procedural earth.

Download (free, CC-BY) from **Solar System Scope**:
https://www.solarsystemscope.com/textures/

| File needed here          | Source file (rename to this)       |
|---------------------------|------------------------------------|
| `earth_day.jpg`           | `2k_earth_daymap.jpg`              |
| `earth_normal.jpg`        | `2k_earth_normal_map.tif` → convert to JPG |
| `earth_spec.jpg`          | `2k_earth_specular_map.tif` → JPG  |
| `earth_clouds.jpg`        | `2k_earth_clouds.jpg`              |
| `earth_night.jpg` (opt.)  | `2k_earth_nightmap.jpg`            |

Higher-res alternatives (8k):
- NASA Visible Earth Blue Marble: https://visibleearth.nasa.gov/collection/1484/blue-marble

After dropping the four required JPGs, restart `npm run dev`. Globe will load real satellite textures with cloud layer and atmospheric fresnel glow.
