/**
 * Email Service Configuration
 * Configure your email service provider here
 */

export const emailConfig = {
  // Email service provider: 'emailjs' or 'custom'
  provider: 'emailjs',

  // EmailJS Configuration
  // Sign up at https://www.emailjs.com/ to get these credentials
  emailjs: {
    serviceId: 'YOUR_SERVICE_ID', // Replace with your EmailJS service ID
    templateId: 'YOUR_TEMPLATE_ID', // Replace with your EmailJS template ID
    publicKey: 'YOUR_PUBLIC_KEY', // Replace with your EmailJS public key
  },

  // Custom API Configuration (if using custom backend)
  custom: {
    endpoint: '/api/contact',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
  },

  // Newsletter Configuration
  newsletter: {
    enabled: true,
    apiEndpoint: '/api/newsletter/subscribe', // Replace with your newsletter API endpoint
    // Or use EmailJS for newsletter too
    useEmailJS: false,
    emailjsServiceId: 'YOUR_NEWSLETTER_SERVICE_ID',
    emailjsTemplateId: 'YOUR_NEWSLETTER_TEMPLATE_ID',
  },

  // Automated Response Configuration
  autoResponse: {
    enabled: true,
    subject: 'Thank you for contacting us!',
    message: `
      Thank you for reaching out! We have received your message and will get back to you within 24-48 hours.
      
      In the meantime, feel free to explore our portfolio and connect with us on social media.
      
      Best regards,
      The Portfolio Team
    `,
  },
}

/**
 * Get email service configuration
 */
export function getEmailConfig() {
  const provider = emailConfig.provider

  if (provider === 'emailjs') {
    return {
      provider: 'emailjs',
      serviceId: emailConfig.emailjs.serviceId,
      templateId: emailConfig.emailjs.templateId,
      publicKey: emailConfig.emailjs.publicKey,
    }
  } else if (provider === 'custom') {
    return {
      provider: 'custom',
      endpoint: emailConfig.custom.endpoint,
      method: emailConfig.custom.method,
      headers: emailConfig.custom.headers,
    }
  }

  return null
}

/**
 * Get newsletter configuration
 */
export function getNewsletterConfig() {
  if (!emailConfig.newsletter.enabled) {
    return null
  }

  if (emailConfig.newsletter.useEmailJS) {
    return {
      provider: 'emailjs',
      serviceId: emailConfig.newsletter.emailjsServiceId,
      templateId: emailConfig.newsletter.emailjsTemplateId,
      publicKey: emailConfig.emailjs.publicKey,
    }
  }

  return {
    provider: 'custom',
    apiEndpoint: emailConfig.newsletter.apiEndpoint,
  }
}
