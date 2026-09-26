# Fase 3 — Reingeniería, microservicios y reportería

## 1. Descripción

La tercera fase consiste en continuar el desarrollo del sistema de monitoreo y alerta temprana para riesgos climáticos desarrollado durante las fases anteriores.

Antes de implementar las nuevas funcionalidades, se deberá realizar una reingeniería arquitectónica del sistema.

El objetivo es evolucionar progresivamente desde la arquitectura centralizada utilizada en las primeras fases hacia una arquitectura basada en microservicios.

Esta fase deberá preparar el sistema para la arquitectura final de la cuarta fase, en la cual se utilizará Kubernetes o K3s y autenticación externa mediante OAuth 2.0/OIDC.

La tercera fase incorpora además un nuevo módulo de reportería. Todos los reportes deberán generarse desde un microservicio independiente y estar disponibles para descarga en formato PDF.

---

## 2. Objetivos

Los objetivos principales son:

1. Realizar la reingeniería del sistema.
2. Separar las principales capacidades en microservicios.
3. Implementar un API Gateway.
4. Mantener autenticación centralizada.
5. Mantener JWT.
6. Incorporar al menos tres lenguajes de programación en backend.
7. Incorporar al menos tres gestores de bases de datos.
8. Incorporar al menos una base de datos no relacional.
9. Crear un microservicio especializado en reportería.
10. Generar documentos PDF desde backend.
11. Integrar los reportes al dashboard.
12. Mantener el sistema desplegado en VPS.
13. Utilizar Docker Compose para la orquestación.
14. Preparar los servicios para una futura migración a Kubernetes/K3s.
15. Diseñar los servicios de manera stateless.
16. Preparar el Auth Service para una futura integración OAuth 2.0/OIDC.

---

## 3. Arquitectura

La arquitectura evolucionará hacia:

```text
                         Internet
                            |
                            v
                     +-------------+
                     |     DNS     |
                     +------+------+
                            |
                            v
                     +-------------+
                     |    Nginx    |
                     +------+------+
                            |
                            v
                     +-------------+
                     | API Gateway |
                     +------+------+
                            |
        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
 +-------------+     +-------------+     +-------------+
 | Auth        |     | Community   |     | Sensor      |
 | Service     |     | Service     |     | Service     |
 | Node/NestJS |     | .NET 10     |     | .NET 10     |
 +-------------+     +-------------+     +-------------+
        |                   |                   |
        v                   v                   v
   PostgreSQL          PostgreSQL           SQL Server


        +-------------------+-------------------+
        |                   |                   |
        v                   v                   v
 +-------------+     +-------------+     +-------------+
 | Alert       |     | Report      |     | Audit       |
 | Service     |     | Service     |     | Service     |
 | Java        |     | Python      |     | Python      |
 | Spring Boot |     | FastAPI     |     | FastAPI     |
 +-------------+     +-------------+     +-------------+
        |                   |                   |
        v                   v                   v
   PostgreSQL            MongoDB             MongoDB
```

---

## 4. Tecnologías

### Frontend
- Angular 22+
- TypeScript
- RxJS
- Angular Material y/o Tailwind CSS

### API Gateway
- ASP.NET Core 10
- YARP

### Auth Service
- Node.js
- NestJS
- TypeScript
- PostgreSQL
- JWT

### Community Service
- C#
- .NET 10
- PostgreSQL

### Sensor Service
- C#
- .NET 10
- SQL Server 2022+

### Alert Service
- Java
- Spring Boot
- PostgreSQL

### Report Service
- Python
- FastAPI
- MongoDB
- Jinja2
- WeasyPrint

### Audit Service
- Python
- FastAPI
- MongoDB

### Infraestructura
- GNU/Linux
- VPS
- Docker
- Docker Compose
- Nginx
- HTTPS

---

## 5. Requisito de heterogeneidad

El backend deberá utilizar como mínimo tres lenguajes de programación diferentes:
- C#
- Java
- TypeScript/Node.js
- Python

También deberá utilizar como mínimo tres gestores de bases de datos:
- SQL Server
- PostgreSQL
- MongoDB (base de datos no relacional)

---

## 6. API Gateway

El API Gateway será el punto de entrada de la aplicación. El frontend no deberá acceder directamente a cada microservicio.

```text
Angular
   |
   v
API Gateway
   |
   +--> /api/auth
   +--> /api/communities
   +--> /api/sensors
   +--> /api/alerts
   +--> /api/reports
   +--> /api/audit
```

El Gateway será responsable de:
- Enrutamiento.
- Validación inicial del JWT.
- CORS.
- Rate limiting cuando corresponda.
- Logging.
- Manejo de errores.
- Ocultar la infraestructura interna.

---

## 7. Auth Service

El Auth Service será responsable de:
- Usuarios.
- Roles.
- Permisos.
- Login / Logout.
- JWT y expiración.
- Validación de identidad.
- Asociación de identidades externas en futuras fases (Google, GitHub, Facebook, OAuth 2.0/OIDC).

*Nota: La autenticación externa será implementada en la Fase 4.*

---

## 8. Sensor Service

Será responsable de:
- Sensores y tipos de sensores.
- Lecturas y estado.
- Simulación e historial de lecturas.

**Tecnologías:** C#, .NET 10, SQL Server.

---

## 9. Community Service

Será responsable de:
- Comunidades, ubicación y estado.
- Información geográfica.
- Asociación lógica con sensores.

**Tecnologías:** C#, .NET 10, PostgreSQL.

---

## 10. Alert Service

Será responsable de:
- Reglas y umbrales.
- Evaluación de alertas y estados.
- Fenómenos climáticos (Inundación, Sequía, Tormenta, Helada, Incendio forestal).
- Niveles de alerta: Verde, Amarillo, Naranja, Rojo.

**Tecnologías:** Java, Spring Boot, PostgreSQL.

---

## 11. Report Service

El Report Service será el componente principal de esta fase, responsable exclusivamente de la generación y administración de reportes.

**Tecnologías:** Python, FastAPI, MongoDB, Jinja2, WeasyPrint.

*El frontend no deberá generar documentos PDF.*

Flujo del proceso:

```text
Angular
   |
   v
API Gateway
   |
   v
Report Service
   |
   +--> Obtener datos
   |
   +--> Preparar información
   |
   +--> Generar HTML
   |
   +--> Convertir HTML a PDF
   |
   +--> Registrar metadata
   |
   v
  PDF
```

---

## 12. Reportes

- **RF-REP-01 — Reporte de comunidades:** Nombre, Municipio, Departamento, País, Coordenadas, Estado, Cantidad de sensores.
- **RF-REP-02 — Reporte de sensores:** Código, Nombre, Tipo, Comunidad, Ubicación, Unidad, Estado, Fecha de instalación.
- **RF-REP-03 — Reporte de lecturas:** Sensor, Comunidad, Fecha, Hora, Valor, Unidad, Estado. Permite filtrar por Sensor, Comunidad, Rango de fechas y Tipo.
- **RF-REP-04 — Reporte de alertas:** Fecha, Hora, Comunidad, Sensor, Fenómeno, Nivel, Valor, Umbral, Mensaje, Estado.
- **RF-REP-05 — Reporte de historial de eventos:** Registro de fenómenos (Inundación, Sequía, Tormenta, Helada, Incendio forestal).
- **RF-REP-06 — Reporte de estado de sensores:** Sensores activos, inactivos, sin comunicación, última lectura y comunidad.
- **RF-REP-07 — Reporte de estadísticas climáticas:** Temperatura (promedio/mín/máx), humedad, viento, lluvia acumulada, nivel de río, alertas.
- **RF-REP-08 — Reporte ejecutivo:** Situación climática global, comunidades, sensores, alertas, eventos e indicadores.
- **RF-REP-09 — Historial de reportes:** Metadata (Id, Tipo, Usuario, Fecha, Parámetros, Estado, Archivo, Fecha de descarga).
- **RF-REP-10 — Descarga:** Exclusivo para administradores autorizados.

---

## 13. Seguridad

Solo usuarios autenticados y autorizados podrán generar y descargar reportes. El Report Service deberá validar el contexto de autenticación recibido (Issuer, Audience, Firma, Expiración, Roles, Permisos).

---

## 14. Reportería y dashboard

El dashboard deberá incorporar una sección de reportes que permita:
- Seleccionar reporte.
- Aplicar filtros.
- Generar y descargar PDF.
- Consultar historial.

---

## 15. Dashboard estadístico

Las nuevas capacidades de reportería alimentarán los indicadores del dashboard (Sensores, Comunidades, Alertas, Eventos, Distribución por nivel/fenómeno, Estadísticas climáticas).

---

## 16. Comunicación entre servicios

Los microservicios deberán comunicarse mediante APIs. Un servicio no deberá acceder directamente a la base de datos de otro servicio.

- **Incorrecto:** `Report Service` -> `SQL Server de Sensor Service`
- **Correcto:** `Report Service` -> `Sensor API`

---

## 17. Persistencia

Cada microservicio gestiona su propia base de datos:
- **Auth Service:** PostgreSQL
- **Community Service:** PostgreSQL
- **Sensor Service:** SQL Server
- **Alert Service:** PostgreSQL
- **Report Service:** MongoDB
- **Audit Service:** MongoDB

---

## 18. MongoDB

MongoDB almacenará información de reportería y auditoría. Ejemplo de metadata:

```json
{
  "reportId": "REP-2026-000001",
  "type": "ALERT_HISTORY",
  "generatedBy": "user-123",
  "generatedAt": "2026-09-24T10:30:00Z",
  "filters": {
    "communityId": 15,
    "from": "2026-09-01",
    "to": "2026-09-24"
  },
  "status": "COMPLETED",
  "fileName": "historial-alertas.pdf"
}
```

---

## 19. Requerimientos no funcionales

- **RNF-REP-01 — Backend:** PDF generados exclusivamente en backend.
- **RNF-REP-02 — Seguridad:** Acceso restringido por roles.
- **RNF-REP-03 — Presentación:** Incluir Logo, Encabezado, Nombre, Fecha, Usuario, Tablas, Numeración, Pie de página.
- **RNF-REP-04 — Rendimiento:** Generación eficiente.
- **RNF-REP-05 — Grandes volúmenes:** Paginación, filtros, procesamiento por lotes o asíncrono.

---

## 20. Infraestructura

Despliegue en VPS utilizando Docker Compose bajo HTTPS (`https://sistema-climatico.example`).

---

## 21. Preparación para Kubernetes

Diseño de contenedores stateless, health checks, variables de entorno, Secrets, ConfigMaps, volúmenes persistentes y graceful shutdown.

---

## 22. Resultado esperado

- Arquitectura de microservicios con API Gateway.
- Servicios: Auth, Community, Sensor, Alert, Report, Audit.
- 3+ lenguajes backend, 3+ gestores de BD (incluyendo NoSQL).
- Generación de PDF en backend e integración con dashboard.
- Despliegue en VPS con Docker Compose, HTTPS y preparado para K8s/OAuth.