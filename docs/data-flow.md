# Flujos de datos

## 1. Flujo de registro

Una persona completa el Google Form con sus datos de participante. El registro llega a Google Sheets y queda disponible para revision operacional. El sistema puede crear o actualizar un registro en Firestore mediante Apps Script y Firebase Cloud Functions.

## 2. Flujo de webhook de donacion/pago

ATH Movil envia un webhook al backend serverless cuando ocurre una donacion o pago. Firebase Cloud Functions recibe el evento, lo normaliza y lo guarda para procesamiento y auditoria.

## 3. Flujo de pareo entre donacion y registro

El sistema intenta parear la donacion con un registro usando el telefono ATH Movil provisto por la persona en el formulario y el telefono recibido desde el webhook. Si el pareo es claro, se marca el registro como confirmado. Si hay ambiguedad, queda para revision manual.

## 4. Flujo de email de confirmacion

Cuando un registro se confirma, el sistema dispara un email automatico con la informacion correspondiente. El email no se envia desde el frontend publico y ninguna credencial del proveedor de email se guarda en este repositorio.

## 5. Flujo de correccion administrativa

El equipo administrativo puede corregir nombre, telefono ATH, estado de pago, participante asociado o numero de corredor desde el dashboard de Google Sheets + Apps Script. Las acciones importantes deben quedar registradas en logs de auditoria.

## 6. Flujo de manejo de duplicados

Cuando existen registros duplicados, el dashboard permite decidir cual registro queda activo, cual se ignora y si un numero de corredor ya confirmado debe anularse o quemarse para evitar conflictos.

## 7. Flujo de pagina publica de progreso

El frontend publico usa datos locales de ejemplo mientras no exista API. En produccion, debe consultar una API publica read-only que devuelva totales agregados y mensajes aprobados, sin exponer datos privados ni acceso directo a Firestore.
