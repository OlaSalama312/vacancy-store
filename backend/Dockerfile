FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY AccessoriesStore.Api/AccessoriesStore.Api.csproj AccessoriesStore.Api/
RUN dotnet restore AccessoriesStore.Api/AccessoriesStore.Api.csproj

COPY AccessoriesStore.Api/ AccessoriesStore.Api/
WORKDIR /src/AccessoriesStore.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "AccessoriesStore.Api.dll"]
