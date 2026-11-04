# 🌽 FAZENDINHA DA ISA — Jogo 3D Online Multiplayer para Navegador

**Fazendinha da Isa** é um jogo online cooperativo 3D completo desenvolvido para execução direta em qualquer navegador (computadores, celulares e tablets). Os jogadores entram como visitantes na fazenda acolhedora da proprietária **ISA**, onde podem plantar milho, cenoura e tomate, regar e colher plantações, alimentar animais (vacas, galinhas e porquinhos), recolher ovos e baldes de leite, cumprir missões e colaborar em uma meta comunitária em tempo real.

---

## 🌟 1. Características e Sistemas Implementados

### 🌾 Personagem Principal: ISA
- **Visual Fiel à Referência**: Baseada na fotografia da Isa — pele em tom aconchegante, cabelos escuros cacheados e volumosos em anéis, olhos grandes e expressivos com reflexos especulares, bochechas coradas e sorriso doce.
- **Vestuário Oficial**: Camiseta rosa, jardineira jeans azul com suspensórios e bolsinho frontal, fivelas de latão dourado, botinhas de fazendeira e chapéu de palha clássico com fita rosa.
- **Animações e Presença**: Articulação 3D viva com respiração, acenos de boas-vindas, identificação sobre a cabeça com estrela dourada (`⭐ ISA (Proprietária)`), balões de diálogo e sistema de missões com recompensas em moedas e experiência.

### 🚜 Mundo 3D da Fazendinha (Three.js & PBR Shaders)
- **Casa Principal da Isa**: Paredes em tom pastel, telhado inclinado em terracota com chaminé de pedra soltando fumaça procedural animada, varanda com degraus de madeira e floreiras coloridas nas janelas.
- **Celeiro Tradicional Vermelho**: Paredes em ripas de madeira vermelha com detalhes brancos em X, mezanino de feno com fardo exposto e galo cata-vento no topo.
- **Horta & Plantações (8 Talhões)**: Canteiros de terra preparada com estágios visuais 3D reais:
  - *Broto inicial* (pequenas mudinhas verdes)
  - *Em crescimento* (folhagens e ramos em desenvolvimento)
  - *Maduro para colheita* (espigas de milho douradas com palha verde, cenouras laranjas brotando da terra e tomates vermelhos brilhantes)
- **Animais Animados com Comportamento Real**:
  - **Vacas Malhadas (Holandesas)**: Mexem a cabeça pastando, balançam o rabo e produzem baldes de leite fresco quando ordenhadas.
  - **Galinhas Caipiras**: Ciscam, bicam grãos, cacarejam e botam ovos frescos.
  - **Porquinhos**: Rolam felizes na lama e abanam seus rabinhos em espiral.
- **Moinho de Vento**: Torre de pedra com 4 pás em treliça girando suavemente com a brisa.
- **Trator Agrícola Vintage**: Trator verde com grandes pneus traseiros frisados, calotas amarelas, volante e escapamento.
- **Rio, Ponte Arqueada e Pomar**: Rio com água cintilante, pedras nas margens, ponte em arco de madeira e macieiras carregadas de maçãs vermelhas.
- **Vida Ambiental**: Borboletas coloridas batendo asas, nuvens fofas passando pelo céu e colinas verdes no horizonte sem vazios.

### 🌐 Sistema Multiplayer em Tempo Real
- **Arquitetura em 3 Camadas**:
  1. **Servidor WebSocket nativo (`/ws/farm`)**: Sincroniza posições, rotações, animações de caminhada e ações em plantações/animais entre navegadores e dispositivos distintos.
  2. **BroadcastChannel (`fazendinha_isa_realtime`)**: Permite testar o multiplayer instantaneamente abrindo duas abas lado a lado no mesmo navegador, com latência zero e sincronização imediata.
  3. **Persistência Local (LocalStorage)**: Salva o inventário, nível, moedas e sementes do jogador para nunca perder o progresso ao recarregar.
- **Avatares Personalizáveis**: Léo (Fazendeirinho), Nina (Jardineira), Theo (Aventureiro) e Bella (Flor da Roça).
- **Chat Predefinido Seguro para Crianças**: Mensagens prontas com balões de fala 3D sobre a cabeça dos personagens.
- **Meta Comunitária Coletiva**: Barra de progresso ao vivo onde todas as espigas de milho colhidas pelos jogadores se somam para uma recompensa compartilhada!

### 🎵 Áudio Procedural com Web Audio API
- **Zero arquivos 404 externos**: Trilha sonora pastoral country e efeitos sonoros gerados por síntese sonora em tempo real:
  - Passos na grama, som de arar terra e plantar sementes
  - Borrifo de água ao regar
  - Som cristalino de moedas e fanfarra harmônica de colheita
  - Mugido da vaca, cacarejo da galinha e oinc do porquinho
  - Botão de volume/mudo no painel inferior

---

## 🎮 2. Controles

- **No Computador**:
  - `W`, `A`, `S`, `D` ou **Setas do Teclado**: Andar pelo mapa
  - Tecla `E` ou **Espaço**: Ação contextual (Plantar sementes, Regar, Colher milho maduro, Conversar com a Isa, Ordenhar vaca, Recolher ovos)
- **No Celular ou Tablet**:
  - **Joystick Virtual**: Arraste o polegar no canto inferior esquerdo para andar suavemente
  - **Botão de Ação**: Toque no botão dourado circular no canto inferior direito para realizar a ação contextual
- **Menu Inferior**:
  - 🎒 **Mochila**: Abrir inventário e vender colheitas
  - 🏪 **Loja**: Comprar sementes (milho, tomate, cenoura, abóbora, morango) e ração
  - 🌽 **Meta**: Visualizar a colheita comunitária
  - 💬 **Falar**: Enviar balões de mensagem predefinida
  - ⭐ **Isa**: Conversar com a proprietária da fazenda e ver missões
  - 🛠️ **Admin**: Painel administrativo (código: `isa2026`)

---

## 🗄️ 3. Banco de Dados e Integração com Supabase (Opcional)

O jogo possui persistência e multiplayer imediatos sem requerer serviços externos. Caso queira conectar o seu projeto do **Supabase** para salvar tudo no PostgreSQL:

1. Acesse o **SQL Editor** do seu painel Supabase.
2. Execute o script contido em:
   ```
   /supabase/schema.sql
   ```
3. No arquivo `.env`, adicione suas credenciais:
   ```env
   VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
   VITE_SUPABASE_ANON_KEY="sua-chave-anon"
   ```

Tabelas configuradas com Row Level Security (RLS):
- `players` (jogadores, níveis, moedas)
- `player_inventory` (sementes, produtos e colheitas)
- `farm_world` & `farm_plots` (talhões, estágios e água)
- `crops` (catálogo de culturas e tempos)
- `animals` (estado e fome dos bichinhos)
- `missions` & `community_goals` (tarefas da Isa e meta comunitária)
- `game_events` (registros para moderação e auditoria)

---

## 🚀 4. Execução e Testes

### Como testar o multiplayer com 2 jogadores:
1. Abra o jogo no navegador.
2. Escolha o apelido "Léo" e entre na fazendinha.
3. Em outra aba (ou janela anônima), abra o mesmo endereço, escolha o apelido "Nina" e entre.
4. Você verá a Nina e o Léo andando juntos na fazendinha, colhendo milho e cooperando em tempo real!
