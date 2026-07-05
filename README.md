# MEJOR PRECIO — Comparador de precios (MercadoLibre)

Comparador de precios que consulta la **API pública de MercadoLibre**.
No usa scraping — solo la API oficial, que no requiere aprobación para búsquedas básicas.

## Estructura

```
mejor-precio/
├── server/          → backend (Node + Express)
│   ├── index.js
│   └── package.json
└── public/          → frontend (HTML/CSS/JS estático)
    ├── index.html
    ├── style.css
    └── script.js
```

## Cómo correrlo en tu máquina

### 1. Backend

```bash
cd server
npm install
npm start
```

Esto levanta el servidor en `http://localhost:3000`. Probalo directo en el navegador:
`http://localhost:3000/api/search?q=zapatillas&category=ropa`

### 2. Frontend

Abrí `public/index.html` directo en el navegador (doble clic), o serví la carpeta con cualquier servidor estático, por ejemplo:

```bash
cd public
npx serve .
```

El frontend ya apunta a `http://localhost:3000` (ver la constante `API_BASE_URL` en `script.js`).

## Cómo funciona

1. El usuario busca un producto en el frontend.
2. El frontend le pega a **tu** backend (`/api/search`), no directo a MercadoLibre — así podés cachear, agregar más tiendas después, y no exponer nada del lado del cliente.
3. El backend consulta `https://api.mercadolibre.com/sites/MLA/search`, normaliza los resultados y los cachea en memoria 10 minutos (para no golpear la API de más).
4. El frontend ordena y muestra los resultados, marcando el más barato.

## Cómo sumar otra tienda más adelante

En `server/index.js`, cada tienda es solo una función que busca y devuelve productos con esta forma:

```js
{ id, name, price, currency, store, link, thumbnail, freeShipping, condition }
```

Agregás tu función al array `PROVIDERS` y listo — el resto del código (orden, caché, endpoint) ya la soporta sin tocar nada más.

Candidatos para el futuro:
- **Amazon** (Product Advertising API) — requiere que te aprueben como afiliado primero.
- Cualquier tienda chica que use **Tiendanube**, que sí tiene una API pública documentada por tienda.

## ⚠️ Sobre alojarlo en Wix

Wix no permite correr un servidor Node/Express propio ni instalar paquetes npm — es un creador de sitios, no un hosting de backends. Si querés que tu sitio "viva" en Wix igual, la única forma es desplegar este proyecto en otro lado (ver abajo) y **embeberlo en una página de Wix con un elemento de HTML/iframe** apuntando a esa URL. Lo más simple, sin embargo, es no usar Wix para esto y publicar directo con las opciones de abajo.

## Deploy gratis en Render (recomendado, ~5 minutos)

1. Subí esta carpeta a un repositorio de GitHub (podés arrastrar los archivos directo en github.com si no usás git todavía).
2. Entrá a [render.com](https://render.com) y creá una cuenta gratis.
3. "New" → "Web Service" → conectá tu repo de GitHub.
4. Render va a detectar el archivo `render.yaml` incluido acá y va a configurar todo solo:
   - Root directory: `server`
   - Build command: `npm install`
   - Start command: `node index.js`
   - Plan: Free
5. Deploy. En unos minutos te da una URL tipo `https://mejor-precio.onrender.com` — esa ya sirve el sitio completo (frontend + backend juntos).

**Nota sobre el plan free de Render**: el servicio "se duerme" después de 15 minutos sin tráfico, y tarda ~30-50 segundos en reactivarse con la primera visita after eso. Para un mes de prueba está perfecto; si en algún momento necesitás que responda siempre al instante, ahí sí conviene pasar a un plan pago (u otro proveedor).

## Alternativas gratuitas a Render

- **Railway** (railway.app) — mecánica similar, tiene un free tier con límite de horas/mes.
- **Fly.io** — requiere un poco más de configuración manual pero también gratis para este tamaño de app.

Ninguna de las tres requiere tarjeta de crédito para el tier gratuito (revisar igual al momento de crear la cuenta, a veces cambian las condiciones).

## Limitaciones a tener en cuenta

- La API de MercadoLibre es **pública y gratuita para búsquedas**, pero tiene límites de rate (no está publicado un número fijo — si escala mucho el tráfico, van a aparecer códigos 429 y hay que sumar más caché o un token de aplicación).
- Los resultados son de **MercadoLibre únicamente** por ahora — no hay otra tienda argentina de electrodomésticos/ropa con API pública real al día de hoy (Coto, Frávega, Musimundo no publican una).
- Para monetizar con el Programa de Afiliados de MercadoLibre, cada link de "Ver oferta" tendría que reemplazarse por tu link de afiliado generado desde tu cuenta — eso no está automatizado acá, es un paso manual o vía su API de afiliados una vez aprobado.
