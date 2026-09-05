FROM php:8.2-apache

# Habilitar módulos de Apache
RUN a2enmod rewrite

# Configurar DocumentRoot a la carpeta API
ENV APACHE_DOCUMENT_ROOT /var/www/html/api
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Crear la carpeta data y dar permisos
RUN mkdir -p /var/www/html/data && chmod -R 777 /var/www/html/data

# Copiar archivos
COPY . /var/www/html/

EXPOSE 80
CMD ["apache2-foreground"]