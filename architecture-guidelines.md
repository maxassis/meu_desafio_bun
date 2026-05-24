# Arquitetura do Projeto

Este projeto usa Bun + Elysia com uma arquitetura simples, funcional e modular.

## Objetivo

Manter uma base facil de entender, testar e evoluir, evitando abstracoes prematuras.

## Principios

- Preferir mudancas pequenas e diretas
- Organizar por modulo ou dominio
- Manter handlers finos
- Colocar regra de negocio em `service`
- Evitar injecao de dependencia formal no inicio
- Adicionar `repository` apenas quando houver banco ou integracao externa relevante
- Evitar estruturas globais por tipo para o projeto inteiro

## Estrutura Base

```txt
src/
  app.ts
  server.ts
  modules/
    <modulo>/
      <modulo>.routes.ts
      services/
      schema/
  shared/
    config/
    db/
    errors/
    utils/
```

## Responsabilidades

### `app.ts`

- Compor a aplicacao
- Registrar plugins e rotas

### `server.ts`

- Subir o servidor
- Definir porta e bootstrap

### `modules/<modulo>/<modulo>.routes.ts`

- Definir endpoints
- Receber `params`, `query` e `body`
- Chamar o `service`
- Nao conter regra de negocio complexa

### `modules/<modulo>/services/*.service.ts`

- Conter regra de negocio
- Orquestrar chamadas internas
- Permanecer independente da camada HTTP sempre que possivel

### `modules/<modulo>/services/*repository*.ts`

Criar somente quando necessario.
Usar para:

- acesso ao banco
- acesso a APIs externas
- persistencia ou leitura de dados

### `modules/<modulo>/schema/*.schema.ts`

Criar quando houver validacao de entrada e saida.
Usar para:

- `body`
- `params`
- `query`
- `response`

Preferir validacao com Zod em schemas separados.
Evitar criar novas validacoes inline na rota com `t.Object`, `t.Union` ou similares do Elysia.
Em codigo legado que ja usa validacao inline, migrar para Zod somente quando a rota for alterada por necessidade real.
As rotas devem fazer parse com schema e delegar a regra de negocio para o `service`.

### `shared/`

Codigo transversal reutilizavel:

- `config/`: variaveis de ambiente e configuracao
- `db/`: conexao com banco, Prisma, helpers de persistencia
- `errors/`: erros padronizados
- `utils/`: helpers genericos

## Convencoes

- Cada modulo deve ficar isolado na propria pasta
- Nomes de arquivos devem seguir o padrao `<modulo>.<papel>.ts` ou o padrao ja estabelecido no modulo
- Nao colocar regra de negocio direto em rotas
- Nao acessar banco diretamente da rota
- Preferir Zod para validacao de entrada e saida
- Manter schemas em arquivos separados e reutilizaveis
- Nao criar abstracoes genericas sem necessidade real
- Preferir imports diretos entre arquivos enquanto o projeto for pequeno ou medio

## Escalabilidade

Quando o projeto crescer, evoluir nesta ordem:

1. Adicionar ou consolidar schemas em `schema/` por modulo
2. Adicionar `repository` onde houver persistencia
3. Criar `shared/config`
4. Criar tratamento global de erros
5. Adicionar testes por modulo

## Banco de Dados

Se usar Prisma:

- manter client compartilhado em `src/shared/db/prisma.ts`
- usar Prisma via `repository` ou, em casos simples, via `service`
- evitar espalhar acesso ao banco em multiplas camadas

## O Que Evitar

- Arquitetura complexa demais cedo demais
- Injecao de dependencia formal sem necessidade
- Pastas globais por tipo para o projeto inteiro
- Rotas gigantes
- Services que conhecem detalhes HTTP
- Repositories sem necessidade real

## Exemplo de Fluxo

- `routes` recebe a requisicao
- `service` executa a regra
- `repository` acessa dados, quando existir
- `routes` devolve a resposta

## Regra de Decisao

Se houver duvida entre duas abordagens corretas:

- escolher a mais simples
- escolher a que adiciona menos arquivos
- escolher a que preserva a clareza do modulo
