# Decisão de naming: NocPilot

**Decidido em 11/07/2026.** O produto de gestão de incidentes / NOC multi-cliente
da Sunny Systems chama-se **NocPilot**. Tagline: *"Every NOC needs a pilot."* /
*"Toda tempestade precisa de um piloto."*

## Racional

1. **Família `*Pilot`.** Cria a linha de produtos da Sunny junto com o
   [RootPilot](08-integracao-rootpilot.md): o RootPilot acha a causa raiz, o
   NocPilot pilota a operação. Dois `*Pilot` viram marca, não coincidência — e a
   integração entre eles (doc 08) passa a parecer inevitável.
2. **O nome carrega a categoria.** O produto *é* um NOC (doc 07); o comprador B2B
   técnico entende antes do pitch. Pronúncia funciona em português e inglês.
3. **A metáfora de aviação se estende ao produto inteiro**: runbooks são
   *checklists* (conceito nascido na aviação), o GoAlert é a *torre* que aciona o
   piloto, o war-room é o *cockpit*, o postmortem é a investigação pós-voo.

## Dossiê de domínios (verificado em 11/07/2026)

| Domínio | Status |
|---|---|
| `nocpilot.io` | ✅ livre → **registrar** |
| `nocpilot.ai` | ✅ livre → **registrar** |
| `nocpilot.com.br` | ✅ livre → **registrar** |
| `nocpilot.dev` / `nocpilot.app` | ✅ livres |
| `nocpilot.com` | ⚠️ registrado em 2018, **sem site** (nenhum servidor responde) — irrelevante para colisão; comprável no futuro |
| Produto de software homônimo | ✅ nenhum encontrado |

Bônus da checagem, para a família: `rootpilot.io` estava **livre** (registrar
junto); `rootpilot.ai` registrado em 13/04/2026 (confirmar se foi a própria
Sunny); `rootpilot.com` é de 02/2025, anterior ao produto — provavelmente de
terceiro.

## Alternativas consideradas

| Nome | Por que caiu |
|---|---|
| **StormPilot** (1ª escolha original) | `stormpilot.io` é um **SaaS ativo** ("Storm Intelligence for Roofing Contractors", lançado em 03/2026); `.com` tomado desde 1999 e `.ai` desde 03/2025. Nome idêntico em software = confusão de marca e risco na classe 42, com alternativa limpa disponível |
| **ClearSky** | Colide com ClearSky DDI (que inclusive faz incident management) e clearsky.app |
| **Farol** | Identidade brasileira bonita, mas menos internacional e fora da família `*Pilot` |
| **Mayday** | Visceral, mas nome comum com colisões prováveis e tom alarmista para venda |
| **Sunspot** | Espirituoso (manchas solares = incidentes no sistema da Sunny), mas batiza o produto com o nome do problema; colide com a lib Ruby Sunspot |
| Pager próprio de nome descritivo (ex. "incident-kit") | Era o codinome do repositório; descritivo demais para virar produto |

## Mapa de nomes

| Coisa | Nome |
|---|---|
| Produto / marca | **NocPilot** |
| Repo template | `sunnysystems/nocpilot` |
| Repos de cliente | `incidents-<cliente>` (inalterado — são instâncias, não o produto) |
| Identificador em payloads (`source`) | `nocpilot` |
| Instância GoAlert da Sunny | sugerido: "Tower" (a torre que aciona o piloto) |

## Lição do processo

Checar nome de produto exige **três verificações, não uma**: busca por produto
homônimo (web), disponibilidade de domínios nos TLDs que importam (`.io`, `.ai`,
`.com`, local) e o *conteúdo* dos domínios tomados (um `.com` de 1999 morto é
ruído; um `.io` recém-registrado com SaaS no ar é veto). O StormPilot passou na
primeira e caiu na terceira.
