# Laboratorio modificado: arquitectura distribuida en 5 PC con NGINX, microservicios y base de datos centralizada

La modificación principal consiste en distribuir los componentes del laboratorio entre cinco computadoras físicas, en lugar de ejecutar todos los servicios dentro de una sola máquina mediante Docker Compose.

La nueva arquitectura permitirá evaluar el balanceo de carga entre tres servidores que ejecutan el mismo microservicio, mientras una quinta computadora proporciona una base de datos centralizada.

## 1. Nueva arquitectura del laboratorio

PC 1 — Gateway y balanceador

NGINX · API Gateway · Load Balancer

IP de ejemplo: 192.168.1.10

Distribución de solicitudes HTTP

PC 2

Microservicio

192.168.1.11

PC 3

Microservicio

192.168.1.12

PC 4

Microservicio

192.168.1.13

Conexiones de los microservicios a la base de datos

PC 5 — Servidor de base de datos

PostgreSQL · Almacenamiento persistente

IP de ejemplo: 192.168.1.14

Las direcciones IP son ejemplos para una red local. Deben sustituirse por las direcciones reales de las cinco computadoras.

### Responsabilidades de cada computadora

| Equipo | Función | Servicios principales |
| --- | --- | --- |
| PC 1 | Entrada y distribución del tráfico | NGINX, API Gateway, balanceador de carga |
| PC 2 | Primera instancia del microservicio | Node.js, Express |
| PC 3 | Segunda instancia del mismo microservicio | Node.js, Express |
| PC 4 | Tercera instancia del mismo microservicio | Node.js, Express |
| PC 5 | Persistencia centralizada | PostgreSQL |

Las tres instancias ejecutarán el mismo código y utilizarán la misma base de datos. La diferencia entre ellas será su identificador, que permitirá reconocer qué equipo atendió cada solicitud.

Esta arquitectura permite estudiar dos elementos diferentes: el escalado horizontal de la capa de aplicación y el efecto que una base de datos compartida puede tener sobre el rendimiento total.

## 2. Requisitos de red e infraestructura

Antes de iniciar, las cinco computadoras deben estar conectadas a la misma red local, preferiblemente mediante Ethernet.

Se recomienda utilizar direcciones IP estáticas o reservas DHCP para que las direcciones de los servicios no cambien durante las pruebas.

| Equipo | IP de ejemplo | Puerto del servicio |
| --- | --- | --- |
| PC 1 — Gateway | `192.168.1.10` | TCP 8080 o 80 |
| PC 2 — Microservicio 1 | `192.168.1.11` | TCP 3000 |
| PC 3 — Microservicio 2 | `192.168.1.12` | TCP 3000 |
| PC 4 — Microservicio 3 | `192.168.1.13` | TCP 3000 |
| PC 5 — PostgreSQL | `192.168.1.14` | TCP 5432 |

Los puertos 3000 y 5432 deben ser accesibles únicamente desde los equipos autorizados. Los clientes externos deben acceder a la aplicación a través de PC 1, no directamente a las API.

### Distribución de herramientas auxiliares

- Prometheus y Grafana: pueden instalarse en PC 1 para centralizar las métricas, siempre que tenga recursos suficientes. Si se hace así, debe documentarse que comparten recursos con el gateway.
- k6: preferiblemente debe ejecutarse desde un equipo cliente adicional. Si solo se dispone de las cinco computadoras, puede ejecutarse desde PC 1 o desde otra PC disponible, procurando que el generador no interfiera significativamente con el balanceador.
- Docker: puede utilizarse en las cinco computadoras para simplificar la instalación y hacer reproducibles los despliegues.

## 3. Configuración del microservicio compartido

Los equipos PC 2, PC 3 y PC 4 deben ejecutar el mismo microservicio, construido a partir del mismo código fuente y la misma versión de la imagen de Docker.

La única diferencia de configuración será el identificador de instancia y, naturalmente, la dirección IP de cada equipo.

Por ejemplo:

- PC 2: `INSTANCE_ID=api1`
- PC 3: `INSTANCE_ID=api2`
- PC 4: `INSTANCE_ID=api3`

El endpoint `/health` debería responder con el estado y el identificador de la instancia. El endpoint `/api/work` puede mantenerse para realizar las pruebas de rendimiento.

### Conexión a la base de datos centralizada

El microservicio debe incorporar un controlador de PostgreSQL. El código original solo simula trabajo de CPU y no utiliza ninguna base de datos, por lo que será necesario añadir esta funcionalidad para que el laboratorio cumpla el nuevo objetivo.

En el archivo `api/package.json`, se debe agregar la dependencia:

json
```
{
  "dependencies": {
    "express": "^5.1.0",
    "prom-client": "^15.1.3",
    "pg": "^8.16.0"
  }
}
```

Las versiones son una referencia para la configuración inicial; conviene validar y fijar las versiones exactas que se instalen.

En cada servidor de microservicios se deben configurar las variables de entorno:

env
```
DB_HOST=192.168.1.14
DB_PORT=5432
DB_NAME=laboratorio
DB_USER=app_user
DB_PASSWORD=<CLAVE_SEGURA>
INSTANCE_ID=api1
```

En PC 3 y PC 4 se utilizará el mismo bloque, cambiando `INSTANCE_ID` por `api2` y `api3`, respectivamente.

La contraseña es ilustrativa y debe sustituirse por una clave real almacenada de forma segura. No debe incluirse en el código fuente ni en el repositorio.

Para conectarse desde Node.js se puede utilizar un pool de conexiones:

javascript
```
const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT || 5432),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 10,
  connectionTimeoutMillis: 3000,
  idleTimeoutMillis: 30000,
});
```

Este bloque debe incorporarse al servidor Express. El límite `max: 10` corresponde a cada instancia, no al conjunto: tres instancias podrían abrir hasta 30 conexiones de cliente, sin contar conexiones administrativas y de monitorización.

Es importante definir una tabla y operaciones SQL para que las solicitudes de prueba ejecuten lecturas o escrituras reales. También conviene agregar un endpoint como `/health/db` para comprobar la conectividad con PostgreSQL sin confundirla con el estado general de la aplicación.

## 4. Configuración de NGINX en PC 1

NGINX será el punto de entrada único de la aplicación. Actuará como proxy reverso, API Gateway básico y balanceador de carga HTTP. La distribución de tráfico se configura mediante `upstream`, que permite definir varios servidores de aplicación. NGINX Documentation

+1

Crear el archivo `nginx.conf` en PC 1:

nginx
```
events {
    worker_connections 2048;
}

http {
    log_format upstream_log
        '$time_iso8601 "$request" status=$status '
        'request_time=$request_time '
        'upstream=$upstream_addr '
        'upstream_status=$upstream_status';

    access_log /var/log/nginx/access.log upstream_log;

    upstream api_backend {
        least_conn;

        server 192.168.1.11:3000 max_fails=3 fail_timeout=10s;
        server 192.168.1.12:3000 max_fails=3 fail_timeout=10s;
        server 192.168.1.13:3000 max_fails=3 fail_timeout=10s;
    }

    server {
        listen 8080;

        location / {
            proxy_pass http://api_backend;
            proxy_http_version 1.1;

            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_connect_timeout 3s;
            proxy_read_timeout 10s;
            proxy_send_timeout 10s;
        }
    }
}
```

### ¿Cómo funciona?

- Las solicitudes llegan a `http://192.168.1.10:8080`.
- NGINX distribuye las solicitudes entre PC 2, PC 3 y PC 4.
- `least_conn` selecciona el servidor con menos conexiones activas.
- Los registros permiten identificar qué instancia recibió cada solicitud.
- Si una instancia falla, NGINX puede dejar de seleccionarla temporalmente después de detectar fallos de comunicación.

La detección de fallos mediante este mecanismo es pasiva: no equivale a una comprobación de salud activa y continua.

El bloque anterior constituye un gateway básico. Si se desea añadir funciones propias de un API Gateway, como autenticación, límites de solicitudes, control de acceso o enrutamiento por versiones de API, deben configurarse de forma explícita.

## 5. Configuración de PostgreSQL en PC 5

En PC 5 se instalará PostgreSQL directamente o mediante Docker. Para este laboratorio, Docker permite simplificar el despliegue y la administración.

Crear un directorio llamado `database` y dentro un archivo `compose.yaml`:

yaml
```
services:
  postgres:
    image: postgres:17
    container_name: laboratorio-postgres
    restart: unless-stopped

    environment:
      POSTGRES_DB: laboratorio
      POSTGRES_USER: app_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}

    ports:
      - "192.168.1.14:5432:5432"

    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./init:/docker-entrypoint-initdb.d:ro

    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U app_user -d laboratorio"]
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

Crear un archivo `.env` en ese directorio:

env
```
DB_PASSWORD=<CLAVE_SEGURA>
```

No se debe publicar ese archivo ni compartir la contraseña en el repositorio.

La dirección `192.168.1.14` debe estar configurada en PC 5 antes de iniciar el contenedor. El puerto de PostgreSQL debe permitirse en el firewall únicamente para las tres computadoras de los microservicios y los equipos administrativos autorizados.

También se debe crear el esquema SQL inicial. Por ejemplo, para una prueba básica de persistencia:

sql
```
CREATE TABLE IF NOT EXISTS solicitudes (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    instancia VARCHAR(20) NOT NULL,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    operacion VARCHAR(30) NOT NULL
);
```

Este esquema permite registrar solicitudes procesadas por cada instancia. Para evitar que el registro se convierta en un cuello de botella artificial, hay que decidir si todas las solicitudes deben escribir en la tabla o si el experimento utilizará una mezcla controlada de lecturas y escrituras.

Iniciar PostgreSQL desde PC 5:

bash
```
docker compose up -d
docker compose ps
```

Desde PC 2, PC 3 y PC 4, comprobar la conectividad de red con PC 5 y después verificar que las credenciales permiten establecer una conexión SQL.

## 6. Monitorización distribuida

La arquitectura original también puede conservar Prometheus y Grafana.

Para ello, se recomienda:

- Instalar Prometheus y Grafana en PC 1, si sus recursos lo permiten.
- Exponer el endpoint `/metrics` de cada microservicio para que Prometheus pueda consultarlo.
- Añadir un exportador de métricas de PostgreSQL en PC 5.
- Instalar un exportador de métricas del sistema en cada equipo si se quiere medir CPU, memoria, disco y red de las cinco computadoras.

La configuración de Prometheus debe apuntar a las direcciones IP reales de las instancias, no a los nombres `api1`, `api2` y `api3` de la configuración Docker Compose original.

Ejemplo de `prometheus.yml`:

yaml
```
global:
  scrape_interval: 5s

scrape_configs:
  - job_name: microservicios
    static_configs:
      - targets:
          - "192.168.1.11:3000"
        labels:
          instance: api1

      - targets:
          - "192.168.1.12:3000"
        labels:
          instance: api2

      - targets:
          - "192.168.1.13:3000"
        labels:
          instance: api3

  - job_name: gateway
    static_configs:
      - targets:
          - "192.168.1.10:9113"

  - job_name: postgres
    static_configs:
      - targets:
          - "192.168.1.14:9187"
```

Los puertos `9113` y `9187` son ejemplos de los puertos habituales de los exportadores de NGINX y PostgreSQL. Deben instalarse y configurarse los exportadores correspondientes antes de habilitar esos objetivos; no son endpoints nativos de NGINX ni de PostgreSQL.

Para las métricas de la aplicación, conviene conservar las consultas de throughput, latencia p95, errores HTTP y solicitudes por instancia. También deben añadirse métricas del pool de conexiones, tiempos de consulta y conexiones activas de PostgreSQL.

## 7. Pruebas de carga con la nueva arquitectura

k6 debe apuntar al gateway de PC 1, nunca directamente a las tres instancias si se pretende evaluar el balanceo.

Ejemplo de solicitud:

javascript
```
const response = http.get(
  "http://192.168.1.10:8080/api/work?ms=20"
);
```

Si el endpoint realiza una operación real de base de datos, se debe crear un escenario de prueba específico para esa operación. Así podrán distinguirse los efectos de la CPU de los efectos del acceso a PostgreSQL.

### Experimentos propuestos

Experimento A: una instancia

Configurar NGINX para enviar tráfico únicamente a PC 2. Registrar throughput, latencia, errores y consumo de recursos.

Experimento B: tres instancias

Activar las tres direcciones en NGINX. Repetir la misma carga y comprobar si se distribuye entre los tres equipos.

Experimento C: carga sobre PostgreSQL

Comparar operaciones de CPU sin acceso a la base de datos con operaciones que consulten o escriban datos. Medir el tiempo de consulta, conexiones y uso de recursos de PC 5.

Experimento D: punto de saturación

Aumentar la carga progresivamente para identificar si el límite se encuentra en el gateway, los microservicios, la red o la base de datos.

La tabla de resultados debe incluir:

| Indicador | 1 instancia | 2 instancias | 3 instancias |
| --- | --- | --- | --- |
| Throughput (solicitudes/s) | Medir | Medir | Medir |
| Latencia p95 (ms) | Medir | Medir | Medir |
| Errores HTTP (%) | Medir | Medir | Medir |
| CPU del microservicio | Medir | Medir | Medir |
| CPU de PC 1 | Medir | Medir | Medir |
| CPU de PC 5 | Medir | Medir | Medir |
| Tiempo de consulta SQL (ms) | Medir | Medir | Medir |
| Conexiones activas a PostgreSQL | Medir | Medir | Medir |

## 8. Consideraciones fundamentales

La nueva arquitectura permite medir mejor el comportamiento de los componentes porque cada equipo tiene una función específica, pero introduce otros posibles cuellos de botella.

- PC 1: puede convertirse en un cuello de botella por ser el punto de entrada de todo el tráfico.
- PC 2, PC 3 y PC 4: pueden saturarse individualmente por CPU, memoria o conexiones.
- PC 5: puede convertirse en el límite global si todas las instancias generan más consultas de las que PostgreSQL puede atender.
- Red local: la latencia, el ancho de banda y los errores de conectividad pueden afectar los resultados.
- Monitorización: ejecutar Prometheus, Grafana y otros servicios en PC 1 consume recursos que también necesita el gateway.

Es importante que la base de datos sea compartida, pero que las operaciones de prueba estén controladas. Si cada solicitud realiza una escritura, el laboratorio estará midiendo tanto el balanceo HTTP como la capacidad de escritura de PostgreSQL.

## 9. Objetivo general revisado

Implementar y evaluar una arquitectura distribuida de cinco computadoras físicas, utilizando NGINX como proxy reverso, API Gateway básico y balanceador de carga; tres instancias idénticas de un microservicio Node.js y Express; y un servidor PostgreSQL centralizado. El laboratorio permitirá analizar el efecto del escalado horizontal, el acceso concurrente a la base de datos y la distribución de solicitudes sobre el rendimiento, la latencia, el throughput, los errores y el uso de recursos.

Conclusión: esta modificación transforma el laboratorio en un experimento distribuido más representativo. La diferencia esencial es que ahora el rendimiento depende de varios equipos físicos y de una base de datos compartida, lo que permite estudiar no solo el balanceo entre instancias, sino también los límites de la arquitectura completa.
