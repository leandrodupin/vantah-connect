# Vantah Media Hub

Crie uma aplicação web completa, moderna e responsiva para a empresa "Vantah Media".

Visual premium em Dark Mode com toques em azul/roxo e tipografia nítida (Tailwind CSS e Lucide Icons).

A aplicação precisa ter perfis de usuário: "client" e "admin".

--- 1. BANCO DE DADOS & SUPABASE (Crie as tabelas e políticas RLS):

- Tabela `profiles`: (id references auth.users, email, full_name, whatsapp, role text default 'client', created_at)

- Tabela `products`: (id, name, description, price numeric, is_active boolean default true) -> Insira um produto padrão: "Cartão de Visita Virtual", Descrição: "Cartão interativo digital com links para WhatsApp, Redes, Pix e Bio", Preço: 49.90.

- Tabela `orders`: (id, user_id references profiles.id, product_id references products.id, amount numeric, status text default 'pending', mercadopago_payment_id text, created_at)

- Tabela `card_customizations`: (id, user_id references profiles.id, order_id references orders.id, display_name, job_title, whatsapp, instagram, linkedin, bio, logo_url, created_at)

--- 2. ROTAS E INTERFACE:

A) LANDING PAGE (/):

- Header com logo "Vantah Media", navegação e botões "Entrar" / "Cadastrar".

- Hero apresentando o "Cartão de Visita Virtual" da Vantah Media.

- Seção de benefícios, demonstração interativa e botão CTA "Comprar Agora".

- Rodapé institucional.

B) AUTENTICAÇÃO (/auth):

- Abas de Login e Cadastro simples (Nome, E-mail, WhatsApp e Senha).

- Ao cadastrar, cria o registro em auth.users e na tabela `profiles`.

- Se o usuário tiver role = 'admin', redireciona para /admin. Se for 'client', vai para /dashboard.

C) PAINEL DO CLIENTE (/dashboard):

- Boas-vindas personalizadas.

- Vitrine do produto: Card do "Cartão de Visita Virtual" (R$ 49,90) com botão "Comprar / Pagar com Mercado Pago".

- Histórico de Pedidos: Lista os pedidos com status (Pendente, Aprovado).

- Formulário do Cartão: Se tiver um pedido com status aprovado (ou liberado), exibe o formulário para preencher os dados que vão no cartão virtual.

D) PAINEL DO ADMINISTRADOR (/admin - protegido apenas para role 'admin'):

- Métricas rápidas: Total de Clientes, Total de Pedidos, Faturamento Total.

- CRUD de Clientes: Tabela com listagem de clientes (pesquisa por nome/email), modal para Adicionar Novo Cliente manualmente, Editar dados do cliente e Excluir cliente.

- Gerenciamento de Pedidos: Tabela com todos os pedidos do sistema, permitindo alterar manualmente o status (ex: de 'pending' para 'approved').

- Gerenciamento do Produto: Área para editar nome, descrição e preço do Cartão de Visita Virtual.

--- 3. INTEGRAÇÃO MERCADO PAGO:

- Crie uma Supabase Edge Function chamada `create-preference` que recebe o `productId` e `userId`, busca o valor no banco e gera a preferência de checkout no Mercado Pago usando a variável `MERCADOPAGO_ACCESS_TOKEN`.

- No clique do botão "Pagar com Mercado Pago", invoque essa Edge Function e redirecione o cliente para o init_point do Mercado Pago.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://vantah-connect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/156fb901-09c7-42d1-aa94-9061d71fba1b).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
