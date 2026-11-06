# Casa Pineda

Vista 3D de la vivienda de C/ Arnau de Vilanova 1, Pineda de Mar (ref. catastral 4389819DG7048N).

Web: https://cfartaesmario-a11y.github.io/casa-pineda/ · Exterior y Planta 1 por dentro (`#planta1`).

## Origen de los datos

| Dato | Fuente |
|---|---|
| Contorno de la parcela y de los 4 cuerpos, fachada de 11,70 m | Catastro (INSPIRE, EPSG:25831) |
| Forma de la cubierta y terraza con malla de sombreo | Google Earth 3D y fotos del anuncio |
| Distribución de la planta 1 | Boceto del propietario, ajustado a las ventanas de fachada |
| Alturas y huecos | Estimados a partir de fotos (± 10 cm) |
| Calles | OpenStreetMap (© colaboradores de OpenStreetMap, ODbL) |

`export/casa_pineda.glb` y `.obj` sirven para Blender o SketchUp.

## Archivos

- `model.js`: exterior (cuerpos, fachada, cubierta, terraza) y entorno de calles.
- `interior.js`: estancias, tabiques, puertas, escalera y chimenea de la planta 1.
- `roads.js`: calles de alrededor.
