// Carga .env para los scripts que corren fuera de Next.
try {
  process.loadEnvFile(".env");
} catch {
  // Sin .env se usan los valores por defecto
}
