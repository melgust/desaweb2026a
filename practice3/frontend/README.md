# Frontend

Aplicacion Angular 18 con componentes independientes y routing.

## Desarrollo local

```bash
npm install
npm start
```

Abre `http://localhost:4200/`.

## Crear un componente

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Produccion con Nginx

La imagen usa un build multi-stage: compila Angular y sirve el resultado con Nginx.

```bash
docker build -t practice3-frontend .
docker run --rm -p 8080:80 practice3-frontend
```

Abre `http://localhost:8080/`.

## Pruebas unitarias

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Pruebas end-to-end

Run `ng e2e` to execute the end-to-end tests via a platform of your choice. To use this command, you need to first add a package that implements end-to-end testing capabilities.

## Ayuda

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
