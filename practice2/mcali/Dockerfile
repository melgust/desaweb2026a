FROM php:8.3-apache

# Enable Apache mod_rewrite for REST API routing
RUN a2enmod rewrite

# Install additional extensions if needed
RUN docker-php-ext-install json

# Copy application
COPY . /var/www/html/

# Set working directory
WORKDIR /var/www/html

# Configure Apache to point to api directory as DocumentRoot
RUN sed -i 's|DocumentRoot /var/www/html|DocumentRoot /var/www/html/api|g' /etc/apache2/sites-available/000-default.conf

# Create .htaccess for URL rewriting
RUN echo 'RewriteEngine On\nRewriteBase /\nRewriteCond %{REQUEST_FILENAME} !-f\nRewriteCond %{REQUEST_FILENAME} !-d\nRewriteRule ^api/(.*)$ index.php [QSA,L]' > /var/www/html/api/.htaccess

EXPOSE 80