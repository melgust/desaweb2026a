FROM php:8.2-cli

WORKDIR /app

COPY . /app

# Aseguramos que el contenedor pueda escribir en data/persons.json
RUN chmod -R 777 /app/data

EXPOSE 8000

CMD ["php", "-S", "0.0.0.0:8000", "index.php"]
