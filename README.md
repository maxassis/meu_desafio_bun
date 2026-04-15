# Meu Desafio Bun

## Banco de dados

Suba o Postgres com Docker ou Podman:

```bash
docker compose up -d
```

ou:

```bash
podman compose up -d
```

O projeto usa a seguinte `DATABASE_URL` por padrao:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/meu_desafio?schema=public
```

## Desenvolvimento

Depois de subir o banco, gere o client Prisma e aplique a migration:

```bash
bun run prisma:generate
bun run prisma:migrate
```

Inicie a aplicacao:

```bash
bun run dev
```

## Documentacao da API

- Scalar: `http://localhost:3000/openapi`
- Better Auth: rotas nativas em `/api/auth/*`

## Autenticacao com Google

Defina as variaveis abaixo no `.env`:

```env
GOOGLE_CLIENT_ID=seu-client-id
GOOGLE_CLIENT_SECRET=seu-client-secret
FRONTEND_URL=http://localhost:3000
```

No Google Cloud Console, configure o URI de redirecionamento autorizado exatamente como:

```text
http://localhost:3000/api/auth/callback/google
```

Para iniciar o login social:

```bash
curl -X POST http://localhost:3000/api/auth/sign-in/social \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "google",
    "callbackURL": "http://localhost:3000",
    "disableRedirect": true
  }'
```

A resposta retorna a `url` para redirecionar o usuario ao Google.

## Verificacao por OTP

O projeto usa OTP por e-mail no fluxo de verificacao de conta.

### Fluxo

1. Crie o usuario com `POST /api/auth/sign-up/email`
2. O Better Auth envia automaticamente um OTP de verificacao para o e-mail
3. Se precisar reenviar, chame `POST /api/auth/email-otp/send-verification-otp`
4. Para confirmar o e-mail, chame `POST /api/auth/email-otp/verify-email`

### Reenviar OTP

```bash
curl -X POST http://localhost:3000/api/auth/email-otp/send-verification-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "type": "email-verification"
  }'
```

### Verificar OTP

```bash
curl -X POST http://localhost:3000/api/auth/email-otp/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456"
  }'
```

### Fluxo de frontend

Web e mobile podem usar o mesmo fluxo:

1. Tela de cadastro
2. Tela de verificacao com campos `email` e `otp`
3. Botao `Reenviar codigo`
4. Confirmacao com `verify-email`

### Regras atuais

- OTP com 6 digitos
- Expiracao em 5 minutos
- 3 tentativas por codigo
- Reenvio reutiliza o mesmo codigo enquanto ele ainda estiver valido
