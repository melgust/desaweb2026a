FROM php:8.3-cli

WORKDIR /app

COPY . .

RUN mkdir -p /app/data \
    && touch /app/data/persons.json \
    && chmod -R 777 /app/data

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "api/index.php"]
