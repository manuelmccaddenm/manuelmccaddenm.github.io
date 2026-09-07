"""Keep reusable facade modules from the CC0 Poly Haven modular factory pack.
Run with Blender in background; source assets are fetched from their published API.
"""
import bpy
from pathlib import Path
root=Path.cwd()
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
bpy.ops.import_scene.gltf(filepath=str(root/'work/assets/factory/source.gltf'))
selected=[]
names=['wall_standard_standard_01','cornice01_standard_standard_01','cornice02_standard_standard_01',
 'wall_door_recessed_small_01','door_recessed_small_01','wall_pier_standard_01']
for style in ['large_01','medium_02','double_01','small_01']:
    names.extend(['wall_window_centered_'+style,'window_centered_'+style])
bpy.ops.object.select_all(action='DESELECT')
for name in names:
    o=bpy.data.objects.get(name)
    if not o:raise RuntimeError('Missing module '+name)
    # Blender import may wrap multi-material primitives in a parent empty.
    objects=[o]+list(o.children_recursive)
    for child in objects:
        child.select_set(True)
        selected.append(child)
    o.location=(0,0,0)
out=root/'explore/media/models/architecture.glb';out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_yup=True,export_image_format='JPEG',export_jpeg_quality=85,export_cameras=False,export_lights=False)
print('EXPORTED',out,out.stat().st_size, 'NODES',len(selected))
