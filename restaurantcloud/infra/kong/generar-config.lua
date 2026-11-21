-- Genera la configuración declarativa de Kong a partir de kong.yml.plantilla y del entorno.
-- Uso: resty generar-config.lua <plantilla> <salida>
--
-- Cada __VARIABLE__ de la plantilla se reemplaza por el valor de la variable de entorno, escrito como
-- cadena JSON (YAML lo acepta como escalar entre comillas dobles). Así una clave PEM de varias líneas
-- no rompe el YAML. Si falta una variable obligatoria, termina con error y Kong no arranca.

local cjson = require "cjson"
cjson.encode_escape_forward_slash(false) -- una clave PEM lleva "/"; "\/" no es un escape de YAML 1.1

local function fallar(mensaje)
  io.stderr:write("generar-config: ", mensaje, "\n")
  os.exit(1)
end

local function leer_entorno(nombre, por_defecto)
  local valor = os.getenv(nombre)
  if valor == nil or valor:match("^%s*$") then
    if por_defecto == nil then
      fallar("falta la variable " .. nombre)
    end
    return por_defecto
  end
  return valor
end

-- La clave llega con "\n" literales (una línea del .env) o con saltos reales: se aceptan ambas.
local function pem(valor)
  valor = valor:gsub("\\n", "\n"):gsub("\r", ""):gsub("^%s+", ""):gsub("%s+$", "")
  if not valor:match("^%-%-%-%-%-BEGIN PUBLIC KEY%-%-%-%-%-") then
    fallar("JWT_PUBLIC_KEY no es una clave pública PEM (debe empezar por -----BEGIN PUBLIC KEY-----)")
  end
  return valor .. "\n"
end

local function lista(valor)
  local elementos = {}
  for elemento in valor:gmatch("[^,]+") do
    elemento = elemento:gsub("^%s+", ""):gsub("%s+$", "")
    if elemento ~= "" then
      elementos[#elementos + 1] = elemento
    end
  end
  return elementos
end

local valores = {
  JWT_PUBLIC_KEY = cjson.encode(pem(leer_entorno("JWT_PUBLIC_KEY"))),
  JWT_EMISOR = cjson.encode(leer_entorno("JWT_EMISOR", "restaurantcloud-nucleo")),
  KONG_CORS_ORIGENES = cjson.encode(lista(leer_entorno("KONG_CORS_ORIGENES", "http://localhost:5173"))),
}

local plantilla_ruta, salida_ruta = arg[1], arg[2]
if not plantilla_ruta or not salida_ruta then
  fallar("uso: resty generar-config.lua <plantilla> <salida>")
end

local entrada = io.open(plantilla_ruta, "r") or fallar("no se pudo leer " .. plantilla_ruta)
local texto = entrada:read("*a")
entrada:close()

local sin_definir = {}
texto = texto:gsub("__([A-Z_]+)__", function(nombre)
  if valores[nombre] == nil then
    sin_definir[#sin_definir + 1] = nombre
    return "__" .. nombre .. "__"
  end
  return valores[nombre]
end)
if #sin_definir > 0 then
  fallar("la plantilla usa variables desconocidas: " .. table.concat(sin_definir, ", "))
end

local salida = io.open(salida_ruta, "w") or fallar("no se pudo escribir " .. salida_ruta)
salida:write(texto)
salida:close()
