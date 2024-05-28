---
layout: post
title:  "Shapefile manipulation with Geopandas"
date:   2024-05-28 13:13:28 
categories: education data-analysis
tags: featured
image: /assets/article_images/2014-08-29-welcome-to-jekyll/desktop.JPG
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

<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>id</th>
      <th>clee</th>
      <th>nom_estab</th>
      <th>raz_social</th>
      <th>codigo_act</th>
      <th>nombre_act</th>
      <th>per_ocu</th>
      <th>tipo_vial</th>
      <th>nom_vial</th>
      <th>tipo_v_e_1</th>
      <th>...</th>
      <th>ageb</th>
      <th>manzana</th>
      <th>telefono</th>
      <th>correoelec</th>
      <th>www</th>
      <th>tipoUniEco</th>
      <th>latitud</th>
      <th>longitud</th>
      <th>fecha_alta</th>
      <th>geometry</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>8362275</td>
      <td>02004611611001791000000000U8</td>
      <td>ACADEMIA DE DANZA DAENSEU</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>AVENIDA</td>
      <td>ARANJUEZ</td>
      <td>AVENIDA</td>
      <td>...</td>
      <td>5940</td>
      <td>018</td>
      <td>None</td>
      <td>ACADEMIADEDANZADAENSEU@GMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.504878</td>
      <td>-116.866163</td>
      <td>2019-11</td>
      <td>POINT (-116.86616 32.50488)</td>
    </tr>
    <tr>
      <th>1</th>
      <td>117215</td>
      <td>02004611611000961000000000U8</td>
      <td>ACADEMIA DE DANZA KULIMA</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>CALLE</td>
      <td>CASTILLO DE CHAPULTEPEC</td>
      <td>CALLE</td>
      <td>...</td>
      <td>3287</td>
      <td>044</td>
      <td>6643810100</td>
      <td>KUILIMAACADEMIA@HOTMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.530170</td>
      <td>-116.986028</td>
      <td>2014-12</td>
      <td>POINT (-116.98603 32.53017)</td>
    </tr>
    <tr>
      <th>2</th>
      <td>6908025</td>
      <td>02001611611000701000000000U4</td>
      <td>ACADEMIA DE DANZA CONGAS CHIC</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>AVENIDA</td>
      <td>PRIMER AYUNTAMIENTO</td>
      <td>CALLE</td>
      <td>...</td>
      <td>7875</td>
      <td>018</td>
      <td>None</td>
      <td>SANDRADELGADO286@GMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>31.861220</td>
      <td>-116.590644</td>
      <td>2019-11</td>
      <td>POINT (-116.59064 31.86122)</td>
    </tr>
    <tr>
      <th>3</th>
      <td>126361</td>
      <td>02004611611000802000000000U4</td>
      <td>ACADEMIA DE DANZA COPELIA</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>6 a 10 personas</td>
      <td>CALLE</td>
      <td>D</td>
      <td>CALLE</td>
      <td>...</td>
      <td>4069</td>
      <td>015</td>
      <td>6646229426</td>
      <td>INFOCOPELIATIJ@GMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.482036</td>
      <td>-116.941097</td>
      <td>2014-12</td>
      <td>POINT (-116.94110 32.48204)</td>
    </tr>
    <tr>
      <th>4</th>
      <td>7368721</td>
      <td>02004611611001701000000000U7</td>
      <td>ACADEMIA DE DANZA VILLA DI DANZA</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>CALLE</td>
      <td>MONTES DE OCA</td>
      <td>CALLE</td>
      <td>...</td>
      <td>5851</td>
      <td>005</td>
      <td>6643751622</td>
      <td>None</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.506026</td>
      <td>-116.865755</td>
      <td>2019-11</td>
      <td>POINT (-116.86576 32.50603)</td>
    </tr>
  </tbody>
</table>
<p>5 rows × 43 columns</p>
</div>



Podemos observar que este Dataframe es de Geopandas.


```python
type(escuelas)
```




    geopandas.geodataframe.GeoDataFrame



Para ver con qué información estamos trabajando, se recomienda checar las columnas del Dataframe. Observamos que la útlimo columna es la de geometría.


```python
escuelas.columns
```




    Index(['id', 'clee', 'nom_estab', 'raz_social', 'codigo_act', 'nombre_act',
           'per_ocu', 'tipo_vial', 'nom_vial', 'tipo_v_e_1', 'nom_v_e_1',
           'tipo_v_e_2', 'nom_v_e_2', 'tipo_v_e_3', 'nom_v_e_3', 'numero_ext',
           'letra_ext', 'edificio', 'edificio_e', 'numero_int', 'letra_int',
           'tipo_asent', 'nomb_asent', 'tipoCenCom', 'nom_CenCom', 'num_local',
           'cod_postal', 'cve_ent', 'entidad', 'cve_mun', 'municipio', 'cve_loc',
           'localidad', 'ageb', 'manzana', 'telefono', 'correoelec', 'www',
           'tipoUniEco', 'latitud', 'longitud', 'fecha_alta', 'geometry'],
          dtype='object')



Checamos las geometrías de nuestros objetos


```python
escuelas.geom_type
```




    0         Point
    1         Point
    2         Point
    3         Point
    4         Point
              ...  
    148545    Point
    148546    Point
    148547    Point
    148548    Point
    148549    Point
    Length: 148550, dtype: object



Cargamos ahora los datos de los estados:


```python
estados = gpd.read_file('Estados')
estados.tail(5)
```


<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>CVEGEO</th>
      <th>CVE_ENT</th>
      <th>NOMGEO</th>
      <th>geometry</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>27</th>
      <td>28</td>
      <td>28</td>
      <td>Tamaulipas</td>
      <td>POLYGON ((2724530.125 1735179.945, 2724595.848...</td>
    </tr>
    <tr>
      <th>28</th>
      <td>29</td>
      <td>29</td>
      <td>Tlaxcala</td>
      <td>POLYGON ((2912153.553 863641.586, 2912195.798 ...</td>
    </tr>
    <tr>
      <th>29</th>
      <td>30</td>
      <td>30</td>
      <td>Veracruz de Ignacio de la Llave</td>
      <td>MULTIPOLYGON (((3119599.686 810246.093, 311958...</td>
    </tr>
    <tr>
      <th>30</th>
      <td>31</td>
      <td>31</td>
      <td>Yucatán</td>
      <td>MULTIPOLYGON (((3511760.832 1023282.324, 35117...</td>
    </tr>
    <tr>
      <th>31</th>
      <td>32</td>
      <td>32</td>
      <td>Zacatecas</td>
      <td>POLYGON ((2515182.307 1441549.749, 2515937.734...</td>
    </tr>
  </tbody>
</table>
</div>




```python
estados.columns
```




    Index(['CVEGEO', 'CVE_ENT', 'NOMGEO', 'geometry'], dtype='object')




```python
estados.geom_type
```




    0          Polygon
    1     MultiPolygon
    2     MultiPolygon
    3     MultiPolygon
    4          Polygon
    5     MultiPolygon
    6          Polygon
    7          Polygon
    8          Polygon
    9          Polygon
    10         Polygon
    11    MultiPolygon
    12         Polygon
    13    MultiPolygon
    14         Polygon
    15         Polygon
    16         Polygon
    17    MultiPolygon
    18         Polygon
    19    MultiPolygon
    20         Polygon
    21         Polygon
    22    MultiPolygon
    23         Polygon
    24    MultiPolygon
    25    MultiPolygon
    26         Polygon
    27         Polygon
    28         Polygon
    29    MultiPolygon
    30    MultiPolygon
    31         Polygon
    dtype: object



## Comandos Básicos

Graficamos el archivo con la función plot(). Al agregar column="entidad" como parámetro, logramos que las escuelas se pinten de colores distintos según la entidad donde se encuentran.


```python
escuelas.plot(column = "entidad")
```




    <Axes: >




    
![png](INEGICLASE_files/INEGICLASE_65_1.png)
    


### set_index() y head()

Los objetos de los shapefiles del INEGI todos tiene un "id", por lo que a suele ser conveniente que ese también sea su índice. Con la función set_index(), cambiamos el índice del dataframe y con la función head(n) podemos ver los primeros n elementos del mismo.


```python
escuelas= escuelas.set_index("id")
escuelas.head(5)
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>clee</th>
      <th>nom_estab</th>
      <th>raz_social</th>
      <th>codigo_act</th>
      <th>nombre_act</th>
      <th>per_ocu</th>
      <th>tipo_vial</th>
      <th>nom_vial</th>
      <th>tipo_v_e_1</th>
      <th>nom_v_e_1</th>
      <th>...</th>
      <th>ageb</th>
      <th>manzana</th>
      <th>telefono</th>
      <th>correoelec</th>
      <th>www</th>
      <th>tipoUniEco</th>
      <th>latitud</th>
      <th>longitud</th>
      <th>fecha_alta</th>
      <th>geometry</th>
    </tr>
    <tr>
      <th>id</th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
      <th></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>8362275</th>
      <td>02004611611001791000000000U8</td>
      <td>ACADEMIA DE DANZA DAENSEU</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>AVENIDA</td>
      <td>ARANJUEZ</td>
      <td>AVENIDA</td>
      <td>AVENIDA DE LAS AGUAS</td>
      <td>...</td>
      <td>5940</td>
      <td>018</td>
      <td>None</td>
      <td>ACADEMIADEDANZADAENSEU@GMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.504878</td>
      <td>-116.866163</td>
      <td>2019-11</td>
      <td>POINT (-116.86616 32.50488)</td>
    </tr>
    <tr>
      <th>117215</th>
      <td>02004611611000961000000000U8</td>
      <td>ACADEMIA DE DANZA KULIMA</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>CALLE</td>
      <td>CASTILLO DE CHAPULTEPEC</td>
      <td>CALLE</td>
      <td>GENERAL ANAYA</td>
      <td>...</td>
      <td>3287</td>
      <td>044</td>
      <td>6643810100</td>
      <td>KUILIMAACADEMIA@HOTMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.530170</td>
      <td>-116.986028</td>
      <td>2014-12</td>
      <td>POINT (-116.98603 32.53017)</td>
    </tr>
    <tr>
      <th>6908025</th>
      <td>02001611611000701000000000U4</td>
      <td>ACADEMIA DE DANZA CONGAS CHIC</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>AVENIDA</td>
      <td>PRIMER AYUNTAMIENTO</td>
      <td>CALLE</td>
      <td>SEGUNDA</td>
      <td>...</td>
      <td>7875</td>
      <td>018</td>
      <td>None</td>
      <td>SANDRADELGADO286@GMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>31.861220</td>
      <td>-116.590644</td>
      <td>2019-11</td>
      <td>POINT (-116.59064 31.86122)</td>
    </tr>
    <tr>
      <th>126361</th>
      <td>02004611611000802000000000U4</td>
      <td>ACADEMIA DE DANZA COPELIA</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>6 a 10 personas</td>
      <td>CALLE</td>
      <td>D</td>
      <td>CALLE</td>
      <td>ATOYAC</td>
      <td>...</td>
      <td>4069</td>
      <td>015</td>
      <td>6646229426</td>
      <td>INFOCOPELIATIJ@GMAIL.COM</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.482036</td>
      <td>-116.941097</td>
      <td>2014-12</td>
      <td>POINT (-116.94110 32.48204)</td>
    </tr>
    <tr>
      <th>7368721</th>
      <td>02004611611001701000000000U7</td>
      <td>ACADEMIA DE DANZA VILLA DI DANZA</td>
      <td>None</td>
      <td>611611</td>
      <td>Escuelas de arte del sector privado</td>
      <td>0 a 5 personas</td>
      <td>CALLE</td>
      <td>MONTES DE OCA</td>
      <td>CALLE</td>
      <td>CONDOMINIO II</td>
      <td>...</td>
      <td>5851</td>
      <td>005</td>
      <td>6643751622</td>
      <td>None</td>
      <td>None</td>
      <td>Fijo</td>
      <td>32.506026</td>
      <td>-116.865755</td>
      <td>2019-11</td>
      <td>POINT (-116.86576 32.50603)</td>
    </tr>
  </tbody>
</table>
<p>5 rows × 42 columns</p>
</div>



Creamos ahora, con ayuda de matplotlib, un mapa de los estados de México.


```python
fig, ax = plt.subplots(figsize=(15, 10))
estados.plot(ax=ax, color='orange', edgecolor='black', alpha=0.4)
ax.set_title("State Boundaries", fontsize=18)
plt.show()
```


    
![png](INEGICLASE_files/INEGICLASE_70_0.png)
    


Así podemos seleccionar sólo una columna del dataframe:


```python
escuelas["latitud"]
```




    id
    8362275    32.504878
    117215     32.530170
    6908025    31.861220
    126361     32.482036
    7368721    32.506026
                 ...    
    4591447    21.001661
    4593523    21.019215
    4458660    18.144051
    4524728    20.990704
    4496460    20.933630
    Name: latitud, Length: 148550, dtype: float64



## Métodos Geográficos

### .area

Para calcular el área de una geometría podemos usar la función .area (nos da el área en metros cuadrados). Creamos en nuestro df una columna que contenga el área. ¡Ojo! Esto sólo funciona para polígonos y multipolígonos, ni las líneas ni los puntos tienen área.


```python
estados["area"] = estados.area / 10**6
```


```python
estados[['NOMGEO','area']]
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>NOMGEO</th>
      <th>area</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>Aguascalientes</td>
      <td>5558.673843</td>
    </tr>
    <tr>
      <th>1</th>
      <td>Baja California</td>
      <td>73412.197393</td>
    </tr>
    <tr>
      <th>2</th>
      <td>Baja California Sur</td>
      <td>72773.977048</td>
    </tr>
    <tr>
      <th>3</th>
      <td>Campeche</td>
      <td>57269.828738</td>
    </tr>
    <tr>
      <th>4</th>
      <td>Coahuila de Zaragoza</td>
      <td>150671.222987</td>
    </tr>
    <tr>
      <th>5</th>
      <td>Colima</td>
      <td>5754.122700</td>
    </tr>
    <tr>
      <th>6</th>
      <td>Chiapas</td>
      <td>73617.359029</td>
    </tr>
    <tr>
      <th>7</th>
      <td>Chihuahua</td>
      <td>246973.359985</td>
    </tr>
    <tr>
      <th>8</th>
      <td>Ciudad de México</td>
      <td>1486.183216</td>
    </tr>
    <tr>
      <th>9</th>
      <td>Durango</td>
      <td>122131.204868</td>
    </tr>
    <tr>
      <th>10</th>
      <td>Guanajuato</td>
      <td>30339.774998</td>
    </tr>
    <tr>
      <th>11</th>
      <td>Guerrero</td>
      <td>63571.942092</td>
    </tr>
    <tr>
      <th>12</th>
      <td>Hidalgo</td>
      <td>20654.545738</td>
    </tr>
    <tr>
      <th>13</th>
      <td>Jalisco</td>
      <td>77969.772969</td>
    </tr>
    <tr>
      <th>14</th>
      <td>México</td>
      <td>22226.853422</td>
    </tr>
    <tr>
      <th>15</th>
      <td>Michoacán de Ocampo</td>
      <td>58301.454670</td>
    </tr>
    <tr>
      <th>16</th>
      <td>Morelos</td>
      <td>4859.413834</td>
    </tr>
    <tr>
      <th>17</th>
      <td>Nayarit</td>
      <td>27825.013468</td>
    </tr>
    <tr>
      <th>18</th>
      <td>Nuevo León</td>
      <td>63558.853869</td>
    </tr>
    <tr>
      <th>19</th>
      <td>Oaxaca</td>
      <td>93967.660873</td>
    </tr>
    <tr>
      <th>20</th>
      <td>Puebla</td>
      <td>34152.671159</td>
    </tr>
    <tr>
      <th>21</th>
      <td>Querétaro</td>
      <td>11589.267541</td>
    </tr>
    <tr>
      <th>22</th>
      <td>Quintana Roo</td>
      <td>44572.370094</td>
    </tr>
    <tr>
      <th>23</th>
      <td>San Luis Potosí</td>
      <td>60499.957929</td>
    </tr>
    <tr>
      <th>24</th>
      <td>Sinaloa</td>
      <td>56815.630835</td>
    </tr>
    <tr>
      <th>25</th>
      <td>Sonora</td>
      <td>180633.837470</td>
    </tr>
    <tr>
      <th>26</th>
      <td>Tabasco</td>
      <td>24701.244026</td>
    </tr>
    <tr>
      <th>27</th>
      <td>Tamaulipas</td>
      <td>79447.171577</td>
    </tr>
    <tr>
      <th>28</th>
      <td>Tlaxcala</td>
      <td>3973.387394</td>
    </tr>
    <tr>
      <th>29</th>
      <td>Veracruz de Ignacio de la Llave</td>
      <td>71467.422417</td>
    </tr>
    <tr>
      <th>30</th>
      <td>Yucatán</td>
      <td>39423.647994</td>
    </tr>
    <tr>
      <th>31</th>
      <td>Zacatecas</td>
      <td>74479.707323</td>
    </tr>
  </tbody>
</table>
</div>



Podemos ahora por ejemplo, sólo graficar los estados con un área mayor a 50000 km cuadrados.


```python
estados_grandes = estados[estados['area'] > 50000]
estados_grandes.plot()
```




    <Axes: >




    
![png](INEGICLASE_files/INEGICLASE_79_1.png)
    


### .boundary

Podemos usar la función .boundary para encontrar tanto la longitud de nuestras líneas como el perímetro de los polígonos.


```python
estados["perimetro"] = estados.boundary
estados.head(5)
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>CVEGEO</th>
      <th>CVE_ENT</th>
      <th>NOMGEO</th>
      <th>geometry</th>
      <th>area</th>
      <th>perimetro</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>01</td>
      <td>01</td>
      <td>Aguascalientes</td>
      <td>POLYGON ((2470517.824 1155028.588, 2470552.248...</td>
      <td>5558.673843</td>
      <td>LINESTRING (2470517.824 1155028.588, 2470552.2...</td>
    </tr>
    <tr>
      <th>1</th>
      <td>02</td>
      <td>02</td>
      <td>Baja California</td>
      <td>MULTIPOLYGON (((1313480.513 1831458.607, 13135...</td>
      <td>73412.197393</td>
      <td>MULTILINESTRING ((1313480.513 1831458.607, 131...</td>
    </tr>
    <tr>
      <th>2</th>
      <td>03</td>
      <td>03</td>
      <td>Baja California Sur</td>
      <td>MULTIPOLYGON (((1694656.344 1227647.637, 16946...</td>
      <td>72773.977048</td>
      <td>MULTILINESTRING ((1694656.344 1227647.637, 169...</td>
    </tr>
    <tr>
      <th>3</th>
      <td>04</td>
      <td>04</td>
      <td>Campeche</td>
      <td>MULTIPOLYGON (((3544897.199 946994.621, 354491...</td>
      <td>57269.828738</td>
      <td>MULTILINESTRING ((3544897.199 946994.621, 3544...</td>
    </tr>
    <tr>
      <th>4</th>
      <td>05</td>
      <td>05</td>
      <td>Coahuila de Zaragoza</td>
      <td>POLYGON ((2469954.193 1978522.993, 2469982.807...</td>
      <td>150671.222987</td>
      <td>LINESTRING (2469954.193 1978522.993, 2469982.8...</td>
    </tr>
  </tbody>
</table>
</div>



Así podemos graficar sólo el perímetro:


```python
estados.boundary.plot()
```




    <Axes: >




    
![png](INEGICLASE_files/INEGICLASE_84_1.png)
    


Guardemos el perímetro de todos los estados en km (notar que otra vez nos los da en metros en un principio).


```python
estados["perimetro"] = estados.boundary.length / 1000
estados.head(5)
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>CVEGEO</th>
      <th>CVE_ENT</th>
      <th>NOMGEO</th>
      <th>geometry</th>
      <th>area</th>
      <th>perimetro</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>01</td>
      <td>01</td>
      <td>Aguascalientes</td>
      <td>POLYGON ((2470517.824 1155028.588, 2470552.248...</td>
      <td>5558.673843</td>
      <td>423.005983</td>
    </tr>
    <tr>
      <th>1</th>
      <td>02</td>
      <td>02</td>
      <td>Baja California</td>
      <td>MULTIPOLYGON (((1313480.513 1831458.607, 13135...</td>
      <td>73412.197393</td>
      <td>3114.717966</td>
    </tr>
    <tr>
      <th>2</th>
      <td>03</td>
      <td>03</td>
      <td>Baja California Sur</td>
      <td>MULTIPOLYGON (((1694656.344 1227647.637, 16946...</td>
      <td>72773.977048</td>
      <td>4086.628211</td>
    </tr>
    <tr>
      <th>3</th>
      <td>04</td>
      <td>04</td>
      <td>Campeche</td>
      <td>MULTIPOLYGON (((3544897.199 946994.621, 354491...</td>
      <td>57269.828738</td>
      <td>1566.405110</td>
    </tr>
    <tr>
      <th>4</th>
      <td>05</td>
      <td>05</td>
      <td>Coahuila de Zaragoza</td>
      <td>POLYGON ((2469954.193 1978522.993, 2469982.807...</td>
      <td>150671.222987</td>
      <td>2414.885296</td>
    </tr>
  </tbody>
</table>
</div>



### .centroid

La función .centroid nos ayuda a calcular el centro de gravedad de cada estado. Representa el centro del círculo con circunferencia más grande que puede entrar en el polígono. Se suele usar para calcular distancias.


```python
estados["centroide"] = estados.centroid
estados.head(5)
```




<div>
<style scoped>
    .dataframe tbody tr th:only-of-type {
        vertical-align: middle;
    }

    .dataframe tbody tr th {
        vertical-align: top;
    }

    .dataframe thead th {
        text-align: right;
    }
</style>
<table border="1" class="dataframe">
  <thead>
    <tr style="text-align: right;">
      <th></th>
      <th>CVEGEO</th>
      <th>CVE_ENT</th>
      <th>NOMGEO</th>
      <th>geometry</th>
      <th>area</th>
      <th>perimetro</th>
      <th>centroide</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <th>0</th>
      <td>01</td>
      <td>01</td>
      <td>Aguascalientes</td>
      <td>POLYGON ((2470517.824 1155028.588, 2470552.248...</td>
      <td>5558.673843</td>
      <td>423.005983</td>
      <td>POINT (2462808.983 1109866.277)</td>
    </tr>
    <tr>
      <th>1</th>
      <td>02</td>
      <td>02</td>
      <td>Baja California</td>
      <td>MULTIPOLYGON (((1313480.513 1831458.607, 13135...</td>
      <td>73412.197393</td>
      <td>3114.717966</td>
      <td>POINT (1243763.617 2110260.341)</td>
    </tr>
    <tr>
      <th>2</th>
      <td>03</td>
      <td>03</td>
      <td>Baja California Sur</td>
      <td>MULTIPOLYGON (((1694656.344 1227647.637, 16946...</td>
      <td>72773.977048</td>
      <td>4086.628211</td>
      <td>POINT (1501178.182 1572567.869)</td>
    </tr>
    <tr>
      <th>3</th>
      <td>04</td>
      <td>04</td>
      <td>Campeche</td>
      <td>MULTIPOLYGON (((3544897.199 946994.621, 354491...</td>
      <td>57269.828738</td>
      <td>1566.405110</td>
      <td>POINT (3722580.440 810059.531)</td>
    </tr>
    <tr>
      <th>4</th>
      <td>05</td>
      <td>05</td>
      <td>Coahuila de Zaragoza</td>
      <td>POLYGON ((2469954.193 1978522.993, 2469982.807...</td>
      <td>150671.222987</td>
      <td>2414.885296</td>
      <td>POINT (2495627.136 1691945.042)</td>
    </tr>
  </tbody>
</table>
</div>



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


    
![png](INEGICLASE_files/INEGICLASE_91_0.png)
    


Usemos los centroides para calcular la distancia de la CDMX a NUevo León en km.


```python
# Encontrar la distancia de CDMX a Nuevo León
centroide_CDMX = estados[estados["NOMGEO"] == 'Ciudad de México']['centroide'].iloc[0]
centroide_NL = estados[estados["NOMGEO"] == 'Nuevo León']['centroide'].iloc[0]
distancia = centroide_CDMX.distance(centroide_NL)/1000
print(distancia)

```

    698.3553486149492


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


    
![png](INEGICLASE_files/INEGICLASE_96_0.png)
    


En este mapa se pueden observar las primarias de rojo, las secundarias de verde, las preparatorias de azul y las que no se reconoció como ninguna de las tres de gris.

### .crs y .buffer()

Con la función .crs podemos checar el CRS que está usando nuestro archivo:


```python
escuelas.crs
```




    <Geographic 2D CRS: GEOGCS["WGS84(DD)",DATUM["WGS84",SPHEROID["WGS84", ...>
    Name: WGS84(DD)
    Axis Info [ellipsoidal]:
    - lon[east]: Longitude (degree)
    - lat[north]: Latitude (degree)
    Area of Use:
    - undefined
    Datum: WGS84
    - Ellipsoid: WGS84
    - Prime Meridian: Greenwich



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


    
![png](INEGICLASE_files/INEGICLASE_104_0.png)
    


El buffer suele ser muy útil para visualización, además de permitirnos sacar áreas de figuras que no la tienen.

### .sjoin()

La función .sjoin() nos permite tomar una geometría existente y agregarle elementos de otro shapefile. En este caso uniremos las escuelas y los estados en una misma geometría.


```python
escuelas_in_ent = gpd.sjoin(escuelas, estados, how='inner', predicate='within')
```

    /tmp/ipykernel_134/1828845042.py:1: UserWarning: CRS mismatch between the CRS of left geometries and the CRS of right geometries.
    Use `to_crs()` to reproject one of the input geometries to match the CRS of the other.
    
    Left CRS: GEOGCS["WGS84(DD)",DATUM["WGS84",SPHEROID["WGS84", ...
    Right CRS: PROJCS["MEXICO_ITRF_2008_LCC",GEOGCS["GCS_MEXICO_I ...
    
      escuelas_in_ent = gpd.sjoin(escuelas, estados, how='inner', predicate='within')


¿Por qué falla?
Porque los shapefiles tienen distintos "Coordinate Reference System" (CRS) que definen cómo se debe proyectar la información geográfica sobre un superficie 2D.


```python
print(estados.crs)
print("\n",escuelas.crs)
```

    PROJCS["MEXICO_ITRF_2008_LCC",GEOGCS["GCS_MEXICO_ITRF_2008",DATUM["International_Terrestrial_Reference_Frame_2008",SPHEROID["GRS 1980",6378137,298.257222101,AUTHORITY["EPSG","7019"]],AUTHORITY["EPSG","1061"]],PRIMEM["Greenwich",0],UNIT["Degree",0.0174532925199433]],PROJECTION["Lambert_Conformal_Conic_2SP"],PARAMETER["latitude_of_origin",12],PARAMETER["central_meridian",-102],PARAMETER["standard_parallel_1",17.5],PARAMETER["standard_parallel_2",29.5],PARAMETER["false_easting",2500000],PARAMETER["false_northing",0],UNIT["metre",1,AUTHORITY["EPSG","9001"]],AXIS["Easting",EAST],AXIS["Northing",NORTH]]
    
     GEOGCS["WGS84(DD)",DATUM["WGS84",SPHEROID["WGS84",6378137,298.257223563]],PRIMEM["Greenwich",0],UNIT["degree",0.0174532925199433],AXIS["Longitude",EAST],AXIS["Latitude",NORTH]]


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


    
![png](INEGICLASE_files/INEGICLASE_114_0.png)
    


### .overlay

La función .overlay también se usa para mezclar geometrías. Sin embargo, se distingue de .sjoin porque no parte de una geometría ya hecha, sino que crea una nueva geometría a partir de las que les provees. Esto es particularmente útil al intersectar geometrías, pues nno tiene sentido que guarde tantos datos si sólo nos interesa la intersección.

Vamos a intersectar los buffers que creamos de las escuelas, con el polígono que representa la CDMX.


```python
escuelas_cdmx = gpd.overlay(estados[estados['NOMGEO']=='Ciudad de México'], escuelas_buffer, how = 'intersection')
```


    ---------------------------------------------------------------------------

    NotImplementedError                       Traceback (most recent call last)

    Cell In[45], line 1
    ----> 1 escuelas_cdmx = gpd.overlay(estados[estados['NOMGEO']=='Ciudad de México'], escuelas_buffer, how = 'intersection')


    File /usr/local/lib/python3.10/site-packages/geopandas/tools/overlay.py:261, in overlay(df1, df2, how, keep_geom_type, make_valid)
        256     raise ValueError(
        257         "`how` was '{0}' but is expected to be in {1}".format(how, allowed_hows)
        258     )
        260 if isinstance(df1, GeoSeries) or isinstance(df2, GeoSeries):
    --> 261     raise NotImplementedError(
        262         "overlay currently only implemented for GeoDataFrames"
        263     )
        265 if not _check_crs(df1, df2):
        266     _crs_mismatch_warn(df1, df2, stacklevel=3)


    NotImplementedError: overlay currently only implemented for GeoDataFrames


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


    
![png](INEGICLASE_files/INEGICLASE_122_0.png)
    


### .to_file()

La función .to_file() sirve para convertir un nuevo geodataframe en un shapefile.


```python
escuelas_buffer_gdf.to_file("escuelas_buffer.shp")
```