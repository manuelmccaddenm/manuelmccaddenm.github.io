"""Build two browser LODs from Poly Haven tree_small_02 (CC0).
Run: blender -b work/assets/tree/source.blend --python scripts/assets/prepare-tree.py
"""
import bpy, os, bmesh, numpy as np
from pathlib import Path
root=Path.cwd()
source=bpy.data.objects['tree_small_02_LOD1']
# Make the texture paths independent of the downloaded blend's directory.
for image in bpy.data.images:
    if image.filepath: image.filepath=str(root/'work/assets/tree/textures'/Path(image.filepath).name)
# Export physically based materials, including the photographed bark and leaves.
for m in source.data.materials:
    if not m: continue
    print('SOURCE_MATERIAL',m.name)
    bsdf=next((n for n in m.node_tree.nodes if n.type=='BSDF_PRINCIPLED'),None)
    if bsdf:
        bsdf.inputs['Roughness'].default_value=.83
# Split by material before decimation so small leaves cannot be consumed by trunk detail.
bpy.ops.object.select_all(action='DESELECT')
source.hide_set(False);source.hide_viewport=False;source.hide_render=False
source.select_set(True);bpy.context.view_layer.objects.active=source
bpy.ops.object.duplicate()
copy=bpy.context.object
bpy.ops.object.mode_set(mode='EDIT');bpy.ops.mesh.select_all(action='SELECT');bpy.ops.mesh.separate(type='MATERIAL');bpy.ops.object.mode_set(mode='OBJECT')
pieces=list(bpy.context.selected_objects)
exports=[]
for lod,ratios in [('near',(.035,.07,.12)),('far',(.007,.018,.035))]:
    for p in pieces:
        o=p.copy();o.data=p.data.copy();bpy.context.collection.objects.link(o)
        o.name='tree_'+lod+'_'+str(len(exports))
        mat=o.data.materials[0].name.lower() if o.data.materials else ''
        ratio=ratios[0] if 'leaves' in mat else ratios[1] if 'branch' in mat else ratios[2]
        if 'leaves' in mat:
            # Rebuild each original leaf as a UV-fitted curved card. Collapsing
            # thousands of disconnected leaves makes them disappear; preserve
            # their silhouette, placement and alpha texture instead.
            mesh=o.data
            parent=list(range(len(mesh.vertices)))
            def find(i):
                while parent[i]!=i:parent[i]=parent[parent[i]];i=parent[i]
                return i
            for edge in mesh.edges:
                a,b=edge.vertices;parent[find(a)]=find(b)
            groups={}
            uv=mesh.uv_layers.active.data
            for poly in mesh.polygons:
                key=find(poly.vertices[0]);groups.setdefault(key,[])
                for li in poly.loop_indices:
                    groups[key].append((tuple(uv[li].uv),tuple(mesh.vertices[mesh.loops[li].vertex_index].co)))
            verts=[];faces=[];uvs=[]
            for i,points in enumerate(groups.values()):
                if i % (4 if lod=='near' else 12):continue
                xy=np.array([p[0] for p in points]);xyz=np.array([p[1] for p in points])
                if len(xy)<3:continue
                lo=xy.min(axis=0);hi=xy.max(axis=0)
                basis=np.column_stack([xy[:,0],xy[:,1],np.ones(len(xy))])
                fit=np.linalg.lstsq(basis,xyz,rcond=None)[0]
                # Texture alpha clips the card back to the original leaf outline.
                corners=[lo,[hi[0],lo[1]],hi,[lo[0],hi[1]]]
                start=len(verts)
                pos=[np.array([u,v,1])@fit for u,v in corners]
                center=np.mean(pos,axis=0);pos=[center+(p-center)*(1.35 if lod=='near' else 1.95) for p in pos]
                verts.extend([tuple(p) for p in pos]);faces.append(tuple(range(start,start+4)));uvs.extend(corners)
            new=bpy.data.meshes.new(o.name+'_cards');new.from_pydata(verts,[],faces)
            new.materials.append(mesh.materials[0]);layer=new.uv_layers.new(name='UVMap')
            for poly in new.polygons:
                for li in poly.loop_indices:layer.data[li].uv=uvs[new.loops[li].vertex_index]
            o.data=new
        else:
            mod=o.modifiers.new('Browser LOD','DECIMATE');mod.ratio=ratio
            bpy.context.view_layer.objects.active=o
            bpy.ops.object.modifier_apply(modifier=mod.name)
        # Source model uses object placement only to arrange its showcase; keep local shape.
        o.location=(0,0,0)
        exports.append(o)
        print('LOD',o.name,mat,len(o.data.polygons))
bpy.ops.object.select_all(action='DESELECT')
for o in exports:o.select_set(True)
out=root/'explore/media/models/tree.glb';out.parent.mkdir(parents=True,exist_ok=True)
bpy.ops.export_scene.gltf(filepath=str(out),export_format='GLB',use_selection=True,export_yup=True,export_image_format='JPEG',export_jpeg_quality=82,export_cameras=False,export_lights=False)
print('EXPORTED',out,out.stat().st_size)
