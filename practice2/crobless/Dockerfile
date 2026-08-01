FROM php:8.3-cli

WORKDIR /app

COPY . .

RUN chown -R www-data:www-data /app/data \
    && chmod -R 775 /app/data

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "api/index.php"]