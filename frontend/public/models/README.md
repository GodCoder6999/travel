# 3D transport models (drop these in)

`TransportIcon` checks for these GLB files. If missing, falls back to the animated SVG version.

Sources (all free CC0 unless noted):

| File needed here | Where to grab |
|------------------|---------------|
| `plane.glb`      | https://poly.pizza/m/2eF7n7vJ2Qe (search "low poly plane" — pick any CC0) |
| `train.glb`      | https://poly.pizza/m/dT8tCgK6N8 |
| `taxi.glb`       | https://poly.pizza/m/8KdQv2bjf2C |
| `car.glb`        | https://poly.pizza/m/c4cyEhfBM7 |
| `metro.glb`      | reuse `train.glb` or grab "subway" |
| `walker.glb`     | https://poly.pizza/m/4VKaUuT4Ahn (low-poly person) |

**Tips for picking a model:**
- < 200 KB ideal (these load 6× on hero)
- Single mesh, baked materials = fastest
- Front-facing pose (camera looks down +Z)

**Recommended workflow:**
1. Browse https://poly.pizza/ — search "airplane", "train", etc.
2. Download `.glb` (preferred) — if only `.gltf+bin` provided, use https://gltf.report/ to bundle into one `.glb`
3. Save under `public/models/<name>.glb`
4. Restart dev server

**Alternative:** Kenney's free packs https://kenney.nl/assets — bulk download `Toy Cars`, `Mini Arsenal`, etc. (CC0). Convert FBX/OBJ → GLB at https://products.aspose.app/3d/conversion/fbx-to-glb.
