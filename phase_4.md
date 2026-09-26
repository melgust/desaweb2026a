# Fase 4 — Autenticación externa, Kubernetes/K3s y arquitectura distribuida

## 1. Descripción

La cuarta fase representa la evolución final del sistema de monitoreo y alerta temprana para riesgos climáticos.

Se continuará utilizando la arquitectura de microservicios desarrollada durante la tercera fase, incorporando autenticación externa mediante OAuth 2.0 y OpenID Connect (OIDC), así como una infraestructura de orquestación basada en Kubernetes o K3s.

Los usuarios podrán autenticarse mediante proveedores externos de identidad como Google y GitHub, centralizados en el Auth Service.

Los demás microservicios deberán consumir y validar los tokens de seguridad generados por el sistema de identidad.

La infraestructura migrará desde Docker Compose hacia Kubernetes/K3s, utilizando Pods, Deployments, Services, Ingress, ConfigMaps y Secrets.

---

## 2. Objetivos

1. Implementar autenticación externa con OAuth 2.0 y OpenID Connect.
2. Integrar proveedores externos (Google, GitHub) y preparar soporte extensible para otros.
3. Mantener JWT y centralizar la autenticación en el Auth Service.
4. Proteger los microservicios.
5. Migrar la infraestructura hacia Kubernetes/K3s.
6. Ejecutar microservicios mediante Pods, Deployments y Services.
7. Implementar Ingress, ConfigMaps, Secrets, health checks y escalabilidad horizontal.
8. Mantener el dominio y HTTPS.

---

## 3. Arquitectura final

```text
                           INTERNET
                              |
                              v
                         DNS / HTTPS
                              |
                              v
                       +-------------+
                       |   Ingress   |
                       +------+------+
                              |
                              v
                       +-------------+
                       | API Gateway |
                       +------+------+
                              |
        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
 +-------------+       +-------------+       +-------------+
 | Auth        |       | Sensor      |       | Community   |
 | Service     |       | Service     |       | Service     |
 | Node/NestJS |       | .NET 10     |       | .NET 10     |
 +-------------+       +-------------+       +-------------+
        |                     |                     |
        v                     v                     v
   PostgreSQL            SQL Server            PostgreSQL


        +---------------------+---------------------+
        |                     |                     |
        v                     v                     v
 +-------------+       +-------------+       +-------------+
 | Alert       |       | Report      |       | Audit       |
 | Service     |       | Service     |       | Service     |
 | Java        |       | Python      |       | Python      |
 | Spring Boot |       | FastAPI     |       | FastAPI     |
 +-------------+       +-------------+       +-------------+
        |                     |                     |
        v                     v                     v
   PostgreSQL              MongoDB               MongoDB
```

*Todo lo anterior deberá ejecutarse dentro de Kubernetes/K3s.*

---

## 4. Autenticación externa

- **RF-OAUTH-01 — OAuth 2.0:** Implementación estándar de OAuth 2.0.
- **RF-OAUTH-02 — OpenID Connect:** Uso de OIDC para datos de identidad.
- **RF-OAUTH-03 — Google:** Login con cuenta de Google.
- **RF-OAUTH-04 — GitHub:** Login con cuenta de GitHub.
- **RF-OAUTH-05 — Extensibilidad:** Arquitectura preparada para agregar Facebook, Microsoft u otros proveedores OIDC.

---

## 5. Flujo de autenticación

```text
Usuario -> Angular -> Auth Service -> [Google / GitHub]
                          |
                          v
               Validación de identidad
                          |
                          v
          Creación/actualización de usuario
                          |
                          v
                         JWT -> Angular -> API Gateway -> Microservicios
```

*Los microservicios no deberán implementar individualmente el login de Google o GitHub.*

---

## 6. JWT

El Auth Service generará un JWT para acceder a las APIs protegidas.

Ejemplo de Payload:

```json
{
  "sub": "user-123",
  "email": "usuario@example.com",
  "name": "Usuario",
  "roles": [
    "ADMIN"
  ],
  "provider": "google",
  "iss": "climate-auth",
  "aud": "climate-api",
  "exp": 1790000000
}
```

Los microservicios deberán validar: Firma, Issuer, Audience, Expiración, Roles y Permisos.

---

## 7. Auth Service

Punto central de identidad. Responsable de: Usuarios, Roles, Permisos, Login/Logout, OAuth 2.0, OpenID Connect, JWT y gestión de cuentas externas. El resto de microservicios no almacenará credenciales de proveedores externos.

---

## 8. Seguridad

- **RNF-OAUTH-01:** Secretos OAuth fuera del código fuente.
- **RNF-OAUTH-02:** Secretos (Client IDs, Client Secrets, JWT keys, credenciales DB) almacenados en Kubernetes Secrets.
- **RNF-OAUTH-03:** Rutas administrativas protegidas por roles.
- **RNF-OAUTH-04:** Rechazo de JWT expirados.
- **RNF-OAUTH-05:** Validación de identidad en APIs internas.

---

## 9. OAuth Callback

URLs HTTPS registradas en los proveedores externos:
- `https://sistema-climatico.example/api/auth/callback/google`
- `https://sistema-climatico.example/api/auth/callback/github`

---

## 10. Kubernetes / K3s

Recomendado K3s para VPS de recursos limitados. Componentes: Cluster, Pods, Deployments, Services, Ingress, ConfigMaps, Secrets, Persistent Volumes y Health Checks.

---

## 11. Pods y Deployments

Los Pods serán administrados por Deployments para asegurar la cantidad de réplicas requeridas.

Ejemplo de Deployment:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: auth-service
spec:
  replicas: 2
```

---

## 12. Kubernetes Services e Ingress

- **Services internos:** Exposición interna de `auth-service`, `sensor-service`, `alert-service`, `community-service`, `report-service`, `audit-service` y `api-gateway`.
- **Ingress Controller:** Único punto de entrada HTTPS para clientes externos (`https://sistema-climatico.example`).

---

## 13. ConfigMaps y Secrets

- **ConfigMaps:** Parámetros no sensibles (URLs internas, entorno, feature flags).
- **Secrets:** OAuth Client Secret, JWT key, contraseñas de bases de datos.

---

## 14. Persistencia y Health Checks

- **Persistencia:** Bases de datos configuradas con `Persistent Volumes`.
- **Health Checks:** Implementación de endpoints `/health` con `Liveness Probe` y `Readiness Probe`.

---

## 15. Roles de usuario

- **ADMIN:** Gestión completa de usuarios, comunidades, sensores, alertas, reportes y auditoría.
- **OPERATOR:** Gestión operativa de sensores, alertas y eventos.
- **VIEWER:** Consulta de dashboard y reportes.

---

## 16. Estrategia de despliegue y estructura del repositorio

Estructura recomendada del repositorio para el proyecto completo:

```text
sistema-monitoreo-climatico/
│
├── README.md
│
├── docs/
│   ├── FASE-1.md
│   ├── FASE-2.md
│   ├── FASE-3.md
│   └── FASE-4.md
│
├── frontend/
│
├── services/
│   ├── api-gateway/
│   ├── auth-service/
│   ├── community-service/
│   ├── sensor-service/
│   ├── alert-service/
│   ├── report-service/
│   └── audit-service/
│
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── k8s/
│
├── database/
│   ├── sqlserver/
│   ├── postgres/
│   └── mongodb/
│
└── .github/
    └── workflows/
```

---

## 17. Criterio de finalización

La Fase 4 se considerará completada cuando:
1. Autenticación funcional con Google y GitHub mediante Auth Service.
2. Generación y validación correcta de JWT en microservicios.
3. Despliegue funcional en Kubernetes/K3s mediante Pods, Deployments, Services, Ingress, ConfigMaps y Secrets.
4. Almacenamiento persistente configurado en bases de datos.
5. Endpoints de salud (`health checks`) activos.
6. Aplicación accesible mediante DNS con HTTPS.
7. Dashboard y reportería operativos en arquitectura distribuida heterogénea (3+ lenguajes, 3+ BDs).