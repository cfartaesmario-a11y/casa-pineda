# Casa Pineda

Planos y modelo 3D de la vivienda de C/ Arnau de Vilanova 1, Pineda de Mar (ref. catastral 4389819DG7048N).

- **Planos** (`index.html`): editor por plantas sobre el contorno oficial del Catastro. Permite dibujar muros, estancias (con m²), puertas, ventanas, texto y trazo libre; calcar una foto de un boceto; y colocar en el plano las fotos del anuncio arrastrándolas.
- **Modelo 3D** (`3d/`): exterior con los 4 cuerpos del Catastro, la cubierta vista en Google Earth y la fachada. Incluye `3d/export/casa_pineda.glb` y `.obj` para Blender o SketchUp.

## Origen de las medidas

| Dato | Fuente |
|---|---|
| Contorno de la parcela y de los 4 cuerpos, ancho de fachada 11,70 m | Catastro (INSPIRE, EPSG:25831) |
| Forma de la cubierta, terraza del cuerpo 2 | Google Earth 3D |
| Alturas de plantas y huecos de fachada | Estimadas a partir de fotos (± 10 cm) |

Las fotos del anuncio no están en el repositorio: se cargan desde tu ordenador y no salen del navegador.

## Uso

Abre la página publicada o sirve la carpeta con cualquier servidor estático (`python -m http.server`). Los dibujos se guardan en el navegador; usa «Descargar JSON» para tener una copia o enviarla.

Atajos: `V` elegir · `W` muro · `R` estancia · `D` puerta · `N` ventana · `P` lápiz · `T` texto · `F` invertir puerta · `Supr` borrar · `Ctrl+Z` / `Ctrl+Y` · `Espacio` + arrastrar para mover el plano · rueda para zoom.
