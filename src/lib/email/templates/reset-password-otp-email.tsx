import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface ResetPasswordOtpEmailProps {
  name: string
  otp: string
  expiresInMinutes: number
}

export const resetPasswordOtpSubject = 'Codigo para redefinir sua senha'

export function ResetPasswordOtpEmail({
  name,
  otp,
  expiresInMinutes,
}: ResetPasswordOtpEmailProps) {
  return (
    <Html lang="pt-BR">
      <Head />
      <Preview>Use o codigo para redefinir sua senha.</Preview>
      <Body style={body}>
        <Container style={container}>
          <Section style={logoWrapper}>
            <Img
              alt="Meu Desafio"
              height="52"
              src="https://yvievpygnysrufdcakbz.supabase.co/storage/v1/object/public/emails//logoEmail.png"
              style={logo}
            />
          </Section>

          <Heading as="h3" style={nameHeading}>
            Ola,
            {' '}
            {name}
            !
          </Heading>

          <Text style={paragraph}>
            Recebemos uma solicitacao para redefinir a senha da sua conta no Meu Desafio app.
          </Text>

          <Text style={paragraph}>
            Informe o codigo abaixo no aplicativo para autorizar a troca de senha:
          </Text>

          <Section style={otpSection}>
            <Text style={otpCode}>{otp}</Text>
          </Section>

          <Text style={emphasis}>
            Esse codigo expira apos
            {' '}
            {expiresInMinutes}
            {' '}
            minutos.
          </Text>

          <Text style={paragraph}>
            Se voce nao solicitou a redefinicao da senha, ignore este e-mail. Sua senha atual continuara valida.
          </Text>

          <Text style={paragraph}>
            Abracos,
            <br />
            Time
            {' '}
            <span style={brandName}>Meu Desafio</span>
          </Text>

          <Hr style={divider} />

          <Text style={systemMessage}>
            Este e-mail e gerado automaticamente pelo nosso sistema. Nao responda.
          </Text>

          <Text style={socialTitle}>Siga nossas redes:</Text>

          <Img
            alt="Instagram"
            height="40"
            src="https://yvievpygnysrufdcakbz.supabase.co/storage/v1/object/public/emails//insta.png"
            style={instagram}
            width="40"
          />

          <Text style={socialLinks}>
            <Link href="https://www.meudesafio.com.br/" style={socialLink}>
              Website
            </Link>
            {' '}
            <span style={socialDivider}>|</span>
            {' '}
            <Link href="https://www.google.com.br/" style={socialLink}>
              App Store
            </Link>
            {' '}
            <span style={socialDivider}>|</span>
            {' '}
            <span style={socialLink}>Google Play</span>
            {' '}
            <span style={socialDivider}>|</span>
            {' '}
            <span style={socialLink}>Fale conosco</span>
          </Text>
        </Container>
      </Body>
    </Html>
  )
}

const body = {
  backgroundColor: '#f4f4f5',
  fontFamily: 'Arial, sans-serif',
  margin: '0',
  padding: '24px 0',
}

const container = {
  backgroundColor: '#ffffff',
  padding: '24px',
  maxWidth: '581px',
  margin: '0 auto',
}

const logoWrapper = {
  backgroundColor: '#12FF55',
  borderRadius: '20px',
  height: '114.87px',
  marginBottom: '23px',
  textAlign: 'center' as const,
}

const logo = {
  display: 'block',
  margin: '31px auto 0',
}

const nameHeading = {
  color: '#000000',
  fontSize: '18px',
  lineHeight: '28px',
  margin: '0 0 20px',
}

const paragraph = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const otpSection = {
  backgroundColor: '#EEEEEE',
  borderRadius: '3px',
  height: '64px',
  margin: '32px auto',
  width: '162px',
  textAlign: 'center' as const,
}

const otpCode = {
  color: '#18181b',
  fontSize: '32px',
  lineHeight: '64px',
  margin: '0',
}

const emphasis = {
  color: '#000000',
  fontSize: '16px',
  fontWeight: '700',
  lineHeight: '24px',
  margin: '0 0 16px',
}

const brandName = {
  fontWeight: '700',
}

const divider = {
  borderColor: '#000000',
  margin: '16px 0',
}

const systemMessage = {
  color: '#71717a',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const socialTitle = {
  color: '#000000',
  fontSize: '18px',
  fontWeight: '700',
  lineHeight: '28px',
  margin: '0 0 16px',
  textAlign: 'center' as const,
}

const instagram = {
  display: 'block',
  margin: '0 auto 16px',
}

const socialLinks = {
  color: '#000000',
  fontSize: '16px',
  lineHeight: '24px',
  margin: '0',
  textAlign: 'center' as const,
}

const socialLink = {
  color: '#000000',
  fontWeight: '700',
  textDecoration: 'underline',
}

const socialDivider = {
  color: '#828282',
}
