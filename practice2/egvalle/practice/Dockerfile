FROM php:8.3-apache

# Enable Apache mod_rewrite (optional for REST APIs)
RUN a2enmod rewrite

# Copy application
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html

EXPOSE 80