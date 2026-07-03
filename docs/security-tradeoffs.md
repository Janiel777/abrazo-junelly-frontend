# Seguridad y tradeoffs

Este sistema fue disenado para un contexto comunitario y benefico, donde reducir friccion es importante. Algunas decisiones priorizan facilidad de uso, costo bajo y operacion rapida, pero los riesgos se documentan y se mitigan con herramientas administrativas.

## Tradeoff principal: pareo por telefono ATH Movil

El sistema parea un registro con una donacion usando el numero de telefono ATH Movil que la persona escribe en el Google Form y que luego llega desde el webhook de pago.

Esto reduce friccion porque no obliga a crear cuentas, passwords, codigos complejos o pasos adicionales para participantes. Para un evento comunitario, ese flujo puede funcionar muy bien.

El riesgo conocido es que una persona podria escribir el telefono ATH de otra persona y accidentalmente o intencionalmente quedar pareada con la donacion de esa persona. Este riesgo no se ignora: es un tradeoff deliberado de bajo-friccion que se maneja con supervision administrativa.

## Mitigaciones

- Dashboard administrativo para revisar estados.
- Correcciones manuales de participante y telefono ATH.
- Deteccion de duplicados.
- Logs de auditoria para acciones importantes.
- Herramientas de asignacion manual.
- Capacidad de anular o quemar numeros confirmados duplicados.
- Revision de pagos no pareados.
- No exponer datos privados en el frontend publico.
- API publica limitada a datos sanitizados y agregados.

## Datos privados

El frontend publico no debe mostrar emails, telefonos, referencias de pago, IDs reales de ATH, logs privados, credenciales de Firebase ni informacion sensible de participantes o donantes.

## Acceso directo a base de datos

El navegador no debe conectarse directamente a Firestore. La ruta publica correcta es una API read-only que controle que datos salen del sistema.

## Auditoria

Las correcciones manuales deben guardar quien hizo la accion, que cambio, cuando ocurrio y por que fue necesario cuando aplique. Esto ayuda a mantener confianza y trazabilidad durante la operacion del evento.
