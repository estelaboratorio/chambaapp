/**
 * Friendly Spanish error mapping for Firebase Authentication
 * Prevents technical raw errors like "Firebase: Error (auth/popup-closed-by-user)"
 */
export function formatAuthError(error: any): { message: string; isPopupError: boolean } {
  if (!error) {
    return { message: 'Ocurrió un error inesperado. Intenta de nuevo.', isPopupError: false };
  }

  const code: string = error.code || '';
  const rawMsg: string = error.message || '';

  // Check popup-related issues
  if (
    code === 'auth/popup-closed-by-user' ||
    rawMsg.includes('popup-closed-by-user') ||
    code === 'auth/cancelled-popup-request' ||
    rawMsg.includes('cancelled-popup-request')
  ) {
    return {
      message: 'La ventana de Google se cerró antes de completar. En ventana de incógnito o dispositivos móviles, tu navegador puede bloquear ventanas emergentes. Puedes reintentar o entrar con tu correo / acceso rápido de prueba.',
      isPopupError: true,
    };
  }

  if (code === 'auth/popup-blocked' || rawMsg.includes('popup-blocked')) {
    return {
      message: 'Tu navegador bloqueó la ventana emergente de Google. Habilita las ventanas emergentes en la barra de navegación o inicia con tu correo.',
      isPopupError: true,
    };
  }

  if (code === 'auth/unauthorized-domain' || rawMsg.includes('unauthorized-domain')) {
    return {
      message: 'Este dominio no está en la lista de dominios autorizados de Google Auth. Puedes usar acceso con correo y contraseña o modo invitado.',
      isPopupError: true,
    };
  }

  if (
    code === 'auth/invalid-credential' ||
    code === 'auth/wrong-password' ||
    rawMsg.includes('invalid-credential') ||
    rawMsg.includes('wrong-password')
  ) {
    return {
      message: 'Correo electrónico o contraseña incorrectos. Revisa tus datos o prueba el acceso rápido con demo@chambaapp.com (123456).',
      isPopupError: false,
    };
  }

  if (code === 'auth/user-not-found' || rawMsg.includes('user-not-found')) {
    return {
      message: 'No existe una cuenta registrada con este correo. Puedes crear una gratis seleccionando "Crear cuenta".',
      isPopupError: false,
    };
  }

  if (code === 'auth/email-already-in-use' || rawMsg.includes('email-already-in-use')) {
    return {
      message: 'Este correo electrónico ya está registrado. Selecciona "Iniciar sesión" o recupera tu contraseña.',
      isPopupError: false,
    };
  }

  if (code === 'auth/weak-password' || rawMsg.includes('weak-password')) {
    return {
      message: 'La contraseña debe tener al menos 6 caracteres.',
      isPopupError: false,
    };
  }

  if (code === 'auth/network-request-failed' || rawMsg.includes('network-request-failed')) {
    return {
      message: 'Error de conexión. Revisa tu acceso a internet e intenta de nuevo.',
      isPopupError: false,
    };
  }

  if (code === 'auth/too-many-requests' || rawMsg.includes('too-many-requests')) {
    return {
      message: 'Demasiados intentos fallidos por seguridad. Espera unos minutos o restablece tu contraseña.',
      isPopupError: false,
    };
  }

  // Fallback clean message
  return {
    message: rawMsg.replace(/^Firebase:\s*Error\s*\((.*?)\)\.?/i, '$1') || 'No se pudo completar la operación. Por favor intenta de nuevo.',
    isPopupError: false,
  };
}
