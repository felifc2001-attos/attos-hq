// Verifica que la app se conecta a Supabase y que la base está bien armada.
// Uso: npm run db:check

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

if (!url || !key) {
  console.error("❌ Faltan NEXT_PUBLIC_SUPABASE_URL o NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY en el archivo .env.local");
  process.exit(1);
}

const supabase = createClient(url, key);

let error;
try {
  ({ error } = await supabase.from("profiles").select("id").limit(1));
} catch (e) {
  console.error("❌ No se pudo llegar a Supabase. Revisá que la URL esté bien escrita.");
  console.error("   Detalle:", e.cause?.code ?? e.message);
  process.exit(1);
}

if (!error) {
  console.log("⚠️  Se conectó, pero se pudieron leer los perfiles sin iniciar sesión.");
  console.log("   La seguridad no quedó como debería: avisame para revisarlo.");
  process.exit(2);
}

if (error.code === "42501") {
  console.log("✅ Conexión correcta: la clave funciona, las tablas existen y están protegidas (sin login no se ve nada).");
} else if (error.code === "PGRST205" || error.code === "42P01") {
  console.log("⚠️  Se conectó, pero todavía no existen las tablas. Falta ejecutar el archivo del esquema en el SQL Editor.");
  process.exit(2);
} else if (/invalid api key/i.test(error.message)) {
  console.log("❌ La clave (anon/publishable) es incorrecta. Copiala de nuevo desde Supabase.");
  process.exit(1);
} else {
  console.log("❓ Respuesta inesperada de Supabase:", error.code, error.message);
  process.exit(2);
}
