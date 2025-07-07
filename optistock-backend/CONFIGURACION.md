# Configuración del Entorno

## Variables de Entorno Requeridas

Para configurar el proyecto, necesitas crear un archivo `.env` en la carpeta `optistock-backend` con las siguientes variables:

```env
PORT=4000
DB_HOST=localhost
DB_USER=postgres
DB_PASSWORD=tu_password_aqui
DB_NAME=optistock
DB_PORT=5432
OPENAI_API_KEY=tu_clave_openai_aqui
```

## Configuración de OpenAI

Para obtener una clave API de OpenAI:

1. Ve a https://platform.openai.com/
2. Crea una cuenta o inicia sesión
3. Ve a API Keys
4. Crea una nueva clave API
5. Reemplaza `tu_clave_openai_aqui` con tu clave real

## Configuración de la Base de Datos

Asegúrate de que PostgreSQL esté instalado y ejecutándose, luego:

1. Crea una base de datos llamada `optistock`
2. Configura las credenciales en el archivo `.env`
3. Ejecuta las migraciones si es necesario

## Instalación

```bash
cd optistock-backend
npm install
npm start
```

## Seguridad

⚠️ **IMPORTANTE**: Nunca subas archivos `.env` a Git. Están incluidos en `.gitignore` para prevenir esto.
