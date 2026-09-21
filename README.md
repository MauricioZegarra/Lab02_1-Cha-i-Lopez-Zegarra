# BiblioPrestamo EPIS - Laboratorio 02

Prototipo web local responsive para gestionar préstamos de libros de una biblioteca universitaria.

## Funcionalidades principales

1. Cliente: buscar libros y enviar una solicitud de préstamo.
2. Administrador: aprobar/rechazar solicitudes y registrar devoluciones.

La aplicación incluye cinco secciones: Inicio, Catálogo, Mis préstamos, Administración (solo admin) y Ayuda.

## Tecnologías

- HTML5
- CSS3
- JavaScript (DOM, eventos y localStorage)
- Vite

## Ejecutar

```bash
npm install
npm run dev
```

Abrir la URL mostrada por Vite, normalmente `http://localhost:5173/`.

## Vistas de demostración

- Cliente: `http://localhost:5173/?role=cliente&view=inicio`
- Catálogo: `http://localhost:5173/?role=cliente&view=catalogo`
- Modal de solicitud: `http://localhost:5173/?role=cliente&view=catalogo&demo=loan`
- Administrador: `http://localhost:5173/?role=admin&view=admin`

## Nota

Es un prototipo local de laboratorio. Los datos se conservan en `localStorage`, por lo que no representa todavía un sistema multiusuario con servidor o base de datos remota.
