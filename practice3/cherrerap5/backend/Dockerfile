# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
# The Api project references sibling source folders (Application, Domain, Infrastructure),
# so copy the whole src tree before restoring/publishing.
COPY src/ ./
RUN --mount=type=secret,id=trusted_ca \
    if [ -f /run/secrets/trusted_ca ]; then export SSL_CERT_FILE=/run/secrets/trusted_ca; fi; \
    dotnet restore "Api/Api.csproj"
RUN dotnet publish "Api/Api.csproj" --no-restore -c Release -o /app/publish /p:UseAppHost=false

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
RUN apt-get update && apt-get install -y --no-install-recommends curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
ENV ASPNETCORE_URLS=http://+:80
EXPOSE 80
ENTRYPOINT ["dotnet", "Api.dll"]
