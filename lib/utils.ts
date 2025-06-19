import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date)
}

/**
 * Valida una CURP (Clave Única de Registro de Población) mexicana
 * @param curp - La CURP a validar
 * @returns true si la CURP es válida, false en caso contrario
 */
export function validateCURP(curp: string): boolean {
  // Si está vacía, considerarla válida (para campos opcionales)
  if (!curp || curp.trim() === "") return true

  // Expresión regular para validar el formato de la CURP
  const curpRegex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[0-9A-Z][0-9]$/

  // Si no cumple con el formato básico, es inválida
  if (!curpRegex.test(curp)) return false

  // Validación adicional: verificar que la fecha sea válida
  const year = Number.parseInt(curp.substring(4, 6))
  const month = Number.parseInt(curp.substring(6, 8))
  const day = Number.parseInt(curp.substring(8, 10))

  // Determinar el siglo (19xx o 20xx)
  const currentYear = new Date().getFullYear() % 100
  const century = year > currentYear ? 1900 : 2000
  const fullYear = century + year

  // Crear objeto Date para validar la fecha
  const date = new Date(fullYear, month - 1, day)

  // Verificar que la fecha sea válida
  if (date.getFullYear() !== fullYear || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return false
  }

  // Si pasó todas las validaciones, la CURP es válida
  return true
}

/**
 * Valida un número de teléfono mexicano
 * @param phone - El número de teléfono a validar
 * @returns true si el teléfono es válido, false en caso contrario
 */
export function validatePhone(phone: string): boolean {
  // Si está vacío, considerarlo válido (para campos opcionales)
  if (!phone || phone.trim() === "") return true

  // Remover espacios y caracteres especiales
  const cleanPhone = phone.replace(/[\s\-$$$$]/g, "")

  // Validar formato de teléfono mexicano (10 dígitos)
  const phoneRegex = /^[0-9]{10}$/

  return phoneRegex.test(cleanPhone)
}
