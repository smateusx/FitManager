/**
 * WhatsApp Service para FitManager
 * Gera links de mensagens para cobrança e avisos.
 */

export const WhatsAppService = {
  /**
   * Gera um link do WhatsApp com mensagem personalizada
   * @param telefone Número do telefone (ex: 5571999999999)
   * @param mensagem Texto da mensagem
   */
  getLink(telefone: string, mensagem: string): string {
    // Remove caracteres não numéricos do telefone
    const cleanPhone = telefone.replace(/\D/g, '')
    // Se não tiver o DDI (55 para Brasil), adiciona
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone
    
    const encodedMsg = encodeURIComponent(mensagem)
    return `https://wa.me/${finalPhone}?text=${encodedMsg}`
  },

  /**
   * Gera mensagem de cobrança padrão
   */
  getBillingMessage(alunoNome: string, planoNome: string, dataVencimento: string, status: 'VENCIDO' | 'VENCENDO_EM_BREVE'): string {
    const dataFormatada = new Date(dataVencimento).toLocaleDateString('pt-BR')
    
    if (status === 'VENCIDO') {
      return `Olá ${alunoNome}! 👋 Passando para lembrar que sua matrícula no plano ${planoNome} venceu no dia ${dataFormatada}. Gostaria de renovar para continuar seus treinos? 🏋️‍♂️`
    }
    
    return `Olá ${alunoNome}! 👋 Sua matrícula no plano ${planoNome} vencerá em breve (${dataFormatada}). Garanta sua renovação para não perder o ritmo! 🚀`
  }
}
