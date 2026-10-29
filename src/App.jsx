/**
 * ============================================================================
 * CHAMBAAPP - APLICACIÓN WEB BETA PARA GESTIÓN DE SERVICIOS A DOMICILIO
 * ============================================================================
 * 
 * Arquitectura modular y ligera diseñada para máxima velocidad en móviles:
 * 
 * 1. IDENTIDAD VISUAL & ACTIVOS EXISTENTES:
 *    - Logo (/logo.png), Favicon (/favicon.ico)
 *    - Audio Tutorial (/audio/tutorial.mp3): Reproductor discreto en cabecera
 *    - Instalación PWA (Botón directo para instalar en celular)
 *    - Tarjeta digital y enlace web público para compartir por WhatsApp
 *    - Pantalla de bienvenida con botón directo "Crear cuenta"
 * 
 * 2. LÓGICA DE NEGOCIO Y MONETIZACIÓN (FREEMIUM):
 *    - Estructura de usuario con contador `servicios_realizados` (inicia en 0)
 *    - Registro de hasta 5 servicios o cotizaciones de forma gratuita
 *    - Al intentar registrar el 6.º servicio sin suscripción activa, se despliega
 *      el modal: "Has alcanzado tus 5 servicios gratuitos de prueba. Activa tu
 *      plan mensual por $250 MXN para continuar agendando."
 * 
 * 3. MÓDULOS PRINCIPALES:
 *    - Autenticación: Registro e inicio de sesión sencillo (email/password)
 *    - Clientes: Alta y lista simplificada (nombre, teléfono, dirección)
 *    - Cotizador: Fórmula exacta de margen sobre ventas:
 *        precio_base = costo_total / (1 - margen_objetivo)
 *        Desglosa: Costo de materiales, Mano de obra, Subtotal, IVA y Total
 *    - Agenda: Calendario y lista por fecha/hora con estados:
 *        Agendado -> En Ejecución -> Completado
 *    - Cobro y Comprobante: Registro de abonos/anticipos, saldo pendiente y recibo
 *        con leyenda visible: "Comprobante de control interno - No válido como CFDI"
 */

import React from 'react';
import App from './App.tsx';

// Exportación principal de ChambaApp
export default App;
