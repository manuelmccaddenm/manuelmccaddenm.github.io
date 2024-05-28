---
layout: post
title: INEGI Shapefiles
tags: geopandas
date: 2024-05-17 18:00 +0800
toc: true
---
# Shapefiles, archivos para análisis de datos geográficos

Los shapefiles son un tipo de archivo que se suele utilizar para guardar, comparir, transformar y analizar datos geográficos. Lo usan instituciones importantes como agencias gubernamentales (incluso el INEGI en México), instituciones académicas y de investigación, planeadores urbanos, etc.

## Archivos en un shapefile
En general, cuando uno descarga un SHP, descarga una carpeta que incluye distintos archivos. A continuación explico los distintos tipos de archivo y para qué sirven. Los tres archivos principales (que no pueden faltar en ningún shapefile) son:

### .shp
Este archivo contiene la geometría real de los objetos espaciales, como puntos, líneas o polígonos.

### .shx
Este archivo es un índice que permite acceder rápidamente a la información almacenada en el archivo .shp.

### .dbf
Este archivo es una tabla de atributos que contiene información no espacial asociada a los objetos geométricos. 

Los shapefiles a veces incluyen otros archivos, aunque estos no son absolutamente necesarios para su funcionamiento.

### .prj

Archivos de proyección que especifican el sistema de coordenadas utilizado, archivos de índices espaciales

### .sbn .sbx

Archivos de índices espaciales que mejoran el rendimiento de consultas espaciales

### .xml

Son archivos de metadatos que proporcionan información adicional sobre los datos.

### .qix

Este archivo se utiliza para almacenar un índice espacial fijo que acelera la búsqueda espacial en un shapefile.

### .fix

Este archivo se utiliza para almacenar un índice espacial basado en un árbol cuaternario (quadtree) que también acelera la búsqueda espacial en un shapefile.

### .cpg

Es la "codificación de caracteres" . Este archivo se utiliza para especificar la codificación de caracteres utilizada en el shapefile.

## Geometrías

Los archivos .shp guardan tres tipos principales de geometrías.

### Puntos

 Representan ubicaciones específicas en el espacio utilizando coordenadas. Por ejemplo, puede representar un punto de interés en un mapa como un hospital o negocio.

### Líneas

Son secuencias de puntos conectados que representan elementos lineales, como carreteras, ríos o límites administrativos. 

### Polígonos

Son áreas cerradas formadas por una secuencia de líneas que se conectan para delimitar un área específica en el espacio. Por ejemplo, un polígono puede representar un país, un lago o un parque.

Todas las geometrías anteriormente mencionadas también existen en su forma plural (multi-puntos, multi-lineas, etc.) y pueden servir para representar otros espacios. Por ejemplo, si yo quiero representar un país compuesto de islas con una sóla geometría, necesitaría guardarlo como un multi-polígono.

## CRS

CRS en un Shapefile se refiere al Sistema de Referencia de Coordenadas (Coordinate Reference System, en inglés). Es una parte fundamental de cualquier conjunto de datos geoespaciales, incluidos los Shapefiles, porque define cómo se mapean las coordenadas geográficas (latitud, longitud) a posiciones en un plano cartesiano. 

Especifica la proyección cartográfica utilizada y las unidades de medida (como metros, pies, grados, etc.). Esto es crucial para interpretar correctamente las coordenadas geográficas y realizar operaciones geoespaciales con precisión, como cálculos de distancia, área, etc.

El CRS depende del tipo de operaciones que se requieren, ya sea en tres dimensiones o proyectadas sobre 2 dimensiones. En el segundo caso, se pueden usar diversas proyecciones que pueden ser mejores según la localización de donde provienen los datos.
Mi recomendación es explicar a Chat-GPT qué tipo de operaciones planeas hacer y de dónde son tus datos y cambiar el crs al que te recomiende. Más tarde enseñaré cómo cambiarlo.

## Visualización rápida

Si sólo te interesa visualizar el contenido geográfico de un shapefile, sin manipular ni observar ningún otro dato, puedes cargar tu archivo .shp en el siguiente link: https://mapshaper.org/

# INEGI Shapefiles

Usaremos información del INEGI como ejemplo. En este link: https://www.inegi.org.mx/app/descarga/ se puede acceder a la información que provee el INEGI.

Utilizaremos datos de los siguientes shapefiles:
* Servicios educativos noviembre 2023
* Marco Geoestadístico diciembre 2022 (https://www.inegi.org.mx/app/biblioteca/ficha.html?upc=889463770541)


Los shapefiles del INEGI vienen en una carpeta que a su vez contiene tres carpetas:
* conjunto_de_datos: es el SHP. Contiene todos los archivos mencionados anteriormente.
* diccionario_de_datos: provee un archivo csv que explica a qué se refieren los nombres de las columnas.
* metadatos: contiene metadatos.

### Leer los Shapefiles usando GeoPandas

Usaremos todas estas librerias para la manipulación de los shapefiles:


```python
import geopandas as gpd 
import pandas as pd
import matplotlib.pyplot as plt
import re
import matplotlib.patches as mpatches
```

## Geopandas

Manipular un Shapefile con Python generalmente se realiza utilizando bibliotecas especializadas como Geopandas y Fiona. Estas bibliotecas proporcionan herramientas poderosas para cargar, manipular y analizar datos geoespaciales almacenados en Shapefiles y otros formatos compatibles.
l
Los dataframes de Geopandas son muy similares a los de pandas, sólo que incluyen una columna que especifica el tipo de geometría con coordenadas.

Aquí se puede consultar la documentación de Geopandas: https://geopandas.org/en/stable/index.html

### Carga de Datos

Vamos a cargar primero la base de datos de Servicios educativos 2023


```python
escuelas = gpd.read_file('Escuelas/conjunto_de_datos/denue_inegi_61_.shp')
escuelas.head(5)
```

Podemos observar que este Dataframe es de Geopandas.


```python
type(escuelas)
```


Para ver con qué información estamos trabajando, se recomienda checar las columnas del Dataframe. Observamos que la útlimo columna es la de geometría.


```python
escuelas.columns
```

Checamos las geometrías de nuestros objetos:


```python
escuelas.geom_type
```

Cargamos ahora los datos de los estados:


```python
estados = gpd.read_file('Estados')
estados.tail(5)
```

```python
estados.columns
```

```python
estados.geom_type
```

## Comandos Básicos

Graficamos el archivo con la función plot(). Al agregar column="entidad" como parámetro, logramos que las escuelas se pinten de colores distintos según la entidad donde se encuentran.


```python
escuelas.plot(column = "entidad")
```

### set_index() y head()

Los objetos de los shapefiles del INEGI todos tiene un "id", por lo que a suele ser conveniente que ese también sea su índice. Con la función set_index(), cambiamos el índice del dataframe y con la función head(n) podemos ver los primeros n elementos del mismo.


```python
escuelas= escuelas.set_index("id")
escuelas.head(5)
```

Creamos ahora, con ayuda de matplotlib, un mapa de los estados de México.


```python
fig, ax = plt.subplots(figsize=(15, 10))
estados.plot(ax=ax, color='orange', edgecolor='black', alpha=0.4)
ax.set_title("State Boundaries", fontsize=18)
plt.show()
```

Así podemos seleccionar sólo una columna del dataframe:


```python
escuelas["latitud"]
```

## Métodos Geográficos

### .area

Para calcular el área de una geometría podemos usar la función .area (nos da el área en metros cuadrados). Creamos en nuestro df una columna que contenga el área. ¡Ojo! Esto sólo funciona para polígonos y multipolígonos, ni las líneas ni los puntos tienen área.


```python
estados["area"] = estados.area / 10**6
```


```python
estados[['NOMGEO','area']]
```

Podemos ahora por ejemplo, sólo graficar los estados con un área mayor a 50000 km cuadrados.


```python
estados_grandes = estados[estados['area'] > 50000]
estados_grandes.plot()
```

### .boundary

Podemos usar la función .boundary para encontrar tanto la longitud de nuestras líneas como el perímetro de los polígonos.


```python
estados["perimetro"] = estados.boundary
estados.head(5)
```

Así podemos graficar sólo el perímetro:


```python
estados.boundary.plot()
```

Guardemos el perímetro de todos los estados en km (notar que otra vez nos los da en metros en un principio).


```python
estados["perimetro"] = estados.boundary.length / 1000
estados.head(5)
```

### .centroid

La función .centroid nos ayuda a calcular el centro de gravedad de cada estado. Representa el centro del círculo con circunferencia más grande que puede entrar en el polígono. Se suele usar para calcular distancias.


```python
estados["centroide"] = estados.centroid
estados.head(5)
```

Grafiquemos los estados con centroides.


```python
# Crear una figura y ejes
fig, ax = plt.subplots(figsize=(10, 8))

# Graficar los estados
estados.plot(ax=ax, color='lightblue', edgecolor='gray')

# Graficar los centroides
estados.centroid.plot(ax=ax, color='red', markersize=20)

plt.title("Estados y sus centroides")
plt.xlabel("Longitud")
plt.ylabel("Latitud")
plt.show()
```

Usemos los centroides para calcular la distancia de la CDMX a NUevo León en km.


```python
# Encontrar la distancia de CDMX a Nuevo León
centroide_CDMX = estados[estados["NOMGEO"] == 'Ciudad de México']['centroide'].iloc[0]
centroide_NL = estados[estados["NOMGEO"] == 'Nuevo León']['centroide'].iloc[0]
distancia = centroide_CDMX.distance(centroide_NL)/1000
print(distancia)

```

### Algunos métodos más elaborados

Podemos usar herramientas como regex para filtrar nuestros datos. Aquí definimos una función que filtra escuelas por primaria, secundaria, preparatoria u otra. Consulta la documentación de regex en: https://docs.python.org/3/library/re.html 


```python
# Definimos los regex que vamos a usar
regex_primaria = r"(?i)(primaria|escuela básica|escuela elemental)"
regex_secundaria = r"(?i)(secundaria|escuela media|educación media)"
regex_prep_bach = r"(?i)(preparatoria|bachillerato|prepa|colegio)"

# Función que determina el color dependiendo de el regex 
def assign_color(row):
    if pd.notna(row['nom_estab']):
        if re.search(regex_prep_bach, row['nom_estab']):
            return 'blue'  # Color for Prepa
        elif re.search(regex_secundaria, row['nom_estab']):
            return 'green'  # Color for Secundaria
        elif re.search(regex_primaria, row['nom_estab']):
            return 'red'  # Color for Primaria
    return 'gray'  # Color if none match

# Aplicamos la función
escuelas['color'] = escuelas.apply(assign_color, axis=1)

# Graficamos
fig, ax = plt.subplots(1, 1, figsize=(10, 10))
escuelas.plot(ax=ax, color=escuelas['color'], markersize=1)  # Adjust markersize as needed
plt.show()
```

En este mapa se pueden observar las primarias de rojo, las secundarias de verde, las preparatorias de azul y las que no se reconoció como ninguna de las tres de gris.

### .crs y .buffer()

Con la función .crs podemos checar el CRS que está usando nuestro archivo:


```python
escuelas.crs
```

Queremos hacer un buffer, que es un área alrededor de cierta geometría. Para esto, tenemos que cambiar nuestro CRS. Tras pedirselo a Chat_GPT nos arrojó este: EPSG 6362. Con la función .to_crs() podemos cambiar el CRS de nuestro archivo.


```python
# Cambiamos el CRS
escuelas_utm = escuelas.to_crs(epsg=6362)  # EPSG 6362 es el de méxico
```

Con la función buffer(n), podemos crear una circunferencia de radio n (metros) alrededor de nuestros puntos. Creamos un buffer de 10km alrededor de cada escuela:


```python
escuelas_buffer = escuelas_utm[escuelas_utm['color'] == 'green'].buffer(10000) 
# Graficamos
fig, ax = plt.subplots(figsize=(15, 10))
escuelas_buffer.plot(ax=ax, color='purple', edgecolor='black', alpha=0.6)
ax.set_title("Escuelas secundarias con un radio de 10 km", fontsize=18)
plt.show()
```

El buffer suele ser muy útil para visualización, además de permitirnos sacar áreas de figuras que no la tienen.

### .sjoin()

La función .sjoin() nos permite tomar una geometría existente y agregarle elementos de otro shapefile. En este caso uniremos las escuelas y los estados en una misma geometría.


```python
escuelas_in_ent = gpd.sjoin(escuelas, estados, how='inner', predicate='within')
```

¿Por qué falla?
Porque los shapefiles tienen distintos "Coordinate Reference System" (CRS) que definen cómo se debe proyectar la información geográfica sobre un superficie 2D.


```python
print(estados.crs)
print("\n",escuelas.crs)
```

Vamos a cambiar el CRS de ambos para que coincidan. Usaremos el mencionado anteriormente, pues funciona muy bien para México.


```python
# Vamos a definir el CRS al que vamos a cambiar
mexico_crs = "EPSG:6362"

# Cambiamos el CRS al de méxico
escuelas = escuelas.to_crs(mexico_crs)
estados = estados.to_crs(mexico_crs)

escuelas_in_ent = gpd.sjoin(escuelas, estados, how='inner', predicate='within')
```

Ahora graficaremos tanto estados como escuelas (filtradas de la misma forma que antes, pero ahora ignorando a las que no son ni primarias, ni secundarias, ni preparatorias).


```python
# Define the regex patterns
regex_primaria = r"(?i)(primaria|escuela básica|escuela elemental)"
regex_secundaria = r"(?i)(secundaria|escuela media|educación media)"
regex_prep_bach = r"(?i)(preparatoria|bachillerato|prepa|colegio)"

# Function to determine color based on regex matching
def assign_color(row):
    if pd.notna(row['nom_estab']):
        if re.search(regex_prep_bach, row['nom_estab']):
            return 'blue'  # Color for Prepa
        elif re.search(regex_secundaria, row['nom_estab']):
            return 'green'  # Color for Secundaria
        elif re.search(regex_primaria, row['nom_estab']):
            return 'red'  # Color for Primaria
    return 'gray'  # Color if none match

# Apply the function to each row
escuelas_in_ent['color'] = escuelas_in_ent.apply(assign_color, axis=1)

# Plotting
fig, ax = plt.subplots(1, 1, figsize=(15, 10))
estados.plot(ax=ax, color='orange', edgecolor='black', alpha=0.4)
escuelas_sin_gris = escuelas_in_ent[escuelas_in_ent['color']!='gray']
escuelas_sin_gris.plot(ax=ax, color=escuelas_sin_gris['color'], markersize=1, legend=True)

legend_patches = [
    mpatches.Patch(color='red', label='Primaria'),
    mpatches.Patch(color='green', label='Secundaria'),
    mpatches.Patch(color='blue', label='Preparatoria'),
]
ax.set_aspect('equal')
ax.legend(handles=legend_patches, loc='upper right', fontsize=12)
ax.set_title("Escuelas en México", fontsize=18)
plt.show()
```

### .overlay

La función .overlay también se usa para mezclar geometrías. Sin embargo, se distingue de .sjoin porque no parte de una geometría ya hecha, sino que crea una nueva geometría a partir de las que les provees. Esto es particularmente útil al intersectar geometrías, pues nno tiene sentido que guarde tantos datos si sólo nos interesa la intersección.

Vamos a intersectar los buffers que creamos de las escuelas, con el polígono que representa la CDMX.


```python
escuelas_cdmx = gpd.overlay(estados[estados['NOMGEO']=='Ciudad de México'], escuelas_buffer, how = 'intersection')
```

¿Por qué falla?

No podemos hacer esto porque nuestras escuelas_buffer son una serie, tenemos que convertirlo a Dataframe.


```python
#Lo convertimos a DataFrame
escuelas_buffer_gdf = gpd.GeoDataFrame(geometry=gpd.GeoSeries(escuelas_buffer), crs=escuelas.crs)
escuelas_cdmx = gpd.overlay(estados[estados['NOMGEO']=='Ciudad de México'], escuelas_buffer_gdf, how = 'intersection')
```


```python
#Graficamos
escuelas_cdmx.plot()

plt.title('Buffer e intersección con CDMX')
plt.xlabel('Longitud')
plt.ylabel('Latitud')
plt.show()
```

### .to_file()

La función .to_file() sirve para convertir un nuevo geodataframe en un shapefile.


```python
escuelas_buffer_gdf.to_file("escuelas_buffer.shp")
```