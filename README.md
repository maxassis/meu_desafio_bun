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
npm run prisma:generate
npm run prisma:migrate
```

Inicie a aplicacao:

```bash
npm run dev
```

## Documentacao da API

- Scalar: `http://localhost:3000/openapi`
- Better Auth: rotas nativas em `/api/auth/*`
