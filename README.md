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
    "otp": "12345"
  }'
```

### Fluxo de frontend

Web e mobile podem usar o mesmo fluxo:

1. Tela de cadastro
2. Tela de verificacao com campos `email` e `otp`
3. Botao `Reenviar codigo`
4. Confirmacao com `verify-email`

## Sessao no mobile

Para app mobile, use apenas o `session token` do Better Auth.

### Fonte de verdade da sessao

- Credencial principal: token retornado no header `set-auth-token`
- Transporte: `Authorization: Bearer <sessionToken>`
- Validacao da sessao: `GET /api/auth/get-session`

### Fluxo recomendado

1. Faça login, cadastro ou verificacao de e-mail
2. Leia o header `set-auth-token` da resposta
3. Salve esse token em armazenamento seguro do dispositivo
4. Envie `Authorization: Bearer <sessionToken>` em toda chamada autenticada
5. Ao abrir o app, valide a sessao chamando `GET /api/auth/get-session`
6. Se a resposta trouxer um novo `set-auth-token`, substitua o token salvo

### Exemplo para validar a sessao

```bash
curl http://localhost:3000/api/auth/get-session \
  -H "Authorization: Bearer <sessionToken>"
```

### Quando usar `/api/auth/token`

`GET /api/auth/token` continua disponivel, mas e opcional. Use apenas se algum outro servico exigir JWT. No app mobile, a sessao deve ser controlada pelo `session token`, nao pelo JWT.

### Regras atuais

- OTP com 5 digitos
- Expiracao em 5 minutos
- 3 tentativas por codigo
- Reenvio reutiliza o mesmo codigo enquanto ele ainda estiver valido
