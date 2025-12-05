// Función utilitaria para traducir claves o mostrar texto crudo
export function translateOrRaw(text: string, t: (key: string) => string) {
  if (!text) return "";
  const translated = t(text);
  // Si la traducción es igual a la clave, retorna el texto original
  return translated === text ? text : translated;
}
