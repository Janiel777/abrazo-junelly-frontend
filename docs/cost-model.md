# Modelo de costos

Esta arquitectura fue disenada intencionalmente para un contexto benefico/sin fines de lucro, donde minimizar costos recurrentes es importante.

## 1. Por que los costos importan

Un evento comunitario necesita operar de forma confiable sin consumir el dinero que debe ir a la causa. Por eso la filosofia tecnica es hacer lo maximo posible con lo menos posible, usando herramientas gratuitas o de bajo costo cuando sean suficientes.

## 2. Servicios usados

- GitHub Pages o hosting estatico similar.
- Google Forms.
- Google Sheets.
- Google Apps Script.
- Firebase Cloud Functions.
- Firestore.
- Proveedor de email/API.
- ATH Movil.
- Dominio opcional.

## 3. Categorias de costos recurrentes

- Hosting publico.
- Ejecucion serverless.
- Lecturas, escrituras y almacenamiento.
- Envio de emails.
- Fees de transacciones.
- Renovacion de dominio.
- Tiempo operacional del equipo.

## 4. Estrategia de free-tier / bajo costo

El frontend se mantiene estatico para que pueda hospedarse en GitHub Pages o una opcion equivalente. El dashboard se apoya en Google Sheets y Apps Script para evitar construir una aplicacion administrativa completa. Firebase se usa para logica y persistencia donde aporta valor real.

## 5. Que costos escalan con uso

- Firebase Cloud Functions: depende de invocaciones, tiempo de ejecucion, memoria y network egress.
- Firestore: depende de lecturas, escrituras, almacenamiento e indices.
- Email provider/API: depende del proveedor y volumen de emails.
- ATH Movil: pueden aplicar fees por transaccion segun la configuracion de ATH Movil/merchant.
- Hosting estatico: normalmente bajo, pero puede depender de ancho de banda y limites vigentes.

## 6. Que partes son gratis o casi gratis

- GitHub repo / GitHub Pages: normalmente gratis para repos publicos y paginas estaticas, verificar limites actuales.
- Google Apps Script: no tiene costo directo por ejecucion en uso normal, pero tiene cuotas y limites.
- Google Sheets: no tiene costo directo en uso normal, pero tiene limites de tamano y rendimiento.
- Google Forms: util para capturar registros sin construir formulario propio.

## 7. Costos operacionales

Aunque algunos servicios no tengan costo directo, el equipo invierte tiempo revisando duplicados, pagos no pareados, errores de datos, correcciones y comunicacion. Ese tiempo tambien es parte del costo real del sistema.

## 8. Costos de renovacion

Un dominio puede tener costo anual de renovacion dependiendo del registrador y del TLD. Tambien pueden existir costos futuros por servicios premium si el evento escala.

## 9. Riesgos futuros de costos

- Mucho trafico publico a la API.
- Aumento en escrituras y lecturas de Firestore.
- Mayor volumen de emails.
- Retencion de logs por demasiado tiempo.
- Necesidad de monitoreo, alertas o dashboards mas avanzados.

## 10. Tabla resumen de costos

| Componente | Proposito | Tipo de costo | Estrategia actual | Riesgo al escalar |
|---|---|---|---|---|
| GitHub Pages | Hosting del frontend estatico | Gratis/bajo costo | Pagina publica de progreso | Limites de ancho de banda/uso |
| Firebase Functions | Backend serverless | Basado en uso | Corre solo en eventos/API calls | Invocaciones/runtime |
| Firestore | Base de datos | Basado en uso | Registros, donaciones y auditoria | Reads/writes/storage |
| Google Sheets | Dashboard admin | Gratis con cuotas | Dashboard operacional | Tamano/rendimiento |
| Apps Script | Automatizacion admin | Gratis con cuotas | Flujos administrativos | Cuotas de ejecucion |
| Dominio | URLs publicas | Renovacion anual | Links cortos y branding | Precio de renovacion |
| Email API | Confirmaciones | Basado en uso/free tier | Emails automaticos | Volumen de emails |
