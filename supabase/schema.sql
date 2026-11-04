-- =====================================================================
-- 🌽 FAZENDINHA DA ISA - ESQUEMA DE BANCO DE DADOS SUPABASE (POSTGRESQL)
-- =====================================================================
-- Executar este script no SQL Editor do Supabase para criar todas as tabelas,
-- índices e políticas de segurança RLS (Row Level Security).

-- 1. Habilitar extensões úteis
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Jogadores (players)
CREATE TABLE IF NOT EXISTS public.players (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nickname VARCHAR(50) NOT NULL,
    avatar VARCHAR(30) DEFAULT 'leo',
    level INT DEFAULT 1,
    experience INT DEFAULT 0,
    coins INT DEFAULT 100,
    is_admin BOOLEAN DEFAULT FALSE,
    is_banned BOOLEAN DEFAULT FALSE,
    last_seen_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Inventário dos Jogadores (player_inventory)
CREATE TABLE IF NOT EXISTS public.player_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    item_id VARCHAR(50) NOT NULL,
    category VARCHAR(30) NOT NULL, -- 'seed', 'crop', 'product', 'tool'
    quantity INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(player_id, item_id)
);

-- 4. Tabela da Fazenda Compartilhada (farm_world)
CREATE TABLE IF NOT EXISTS public.farm_world (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) DEFAULT 'Fazendinha da Isa',
    level INT DEFAULT 1,
    total_harvests INT DEFAULT 0,
    weather VARCHAR(20) DEFAULT 'sunny', -- 'sunny', 'rainy', 'party'
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Talhões da Plantação (farm_plots)
CREATE TABLE IF NOT EXISTS public.farm_plots (
    id INT PRIMARY KEY,
    crop_type VARCHAR(30), -- 'corn', 'carrot', 'tomato', 'pumpkin', 'strawberry'
    stage INT DEFAULT 0, -- 0: vazio, 1: broto, 2: crescendo, 3: maduro
    is_watered BOOLEAN DEFAULT FALSE,
    planted_by UUID REFERENCES public.players(id) ON DELETE SET NULL,
    planted_at TIMESTAMPTZ,
    growth_duration_seconds INT DEFAULT 30,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Tabela de Catálogo de Culturas (crops)
CREATE TABLE IF NOT EXISTS public.crops (
    id VARCHAR(30) PRIMARY KEY,
    name VARCHAR(50) NOT NULL,
    seed_cost INT DEFAULT 10,
    sell_value INT DEFAULT 25,
    growth_time_seconds INT DEFAULT 30,
    xp_reward INT DEFAULT 15,
    water_multiplier FLOAT DEFAULT 0.7
);

INSERT INTO public.crops (id, name, seed_cost, sell_value, growth_time_seconds, xp_reward, water_multiplier)
VALUES
    ('corn', 'Milho Dourado', 10, 25, 30, 20, 0.7),
    ('carrot', 'Cenoura Crocante', 8, 20, 25, 15, 0.7),
    ('tomato', 'Tomate Vermelhinho', 12, 30, 35, 25, 0.7),
    ('pumpkin', 'Abóbora Gigante', 25, 60, 45, 45, 0.7),
    ('strawberry', 'Morango Doce', 20, 50, 40, 35, 0.7)
ON CONFLICT (id) DO NOTHING;

-- 7. Tabela de Animais da Fazenda (animals)
CREATE TABLE IF NOT EXISTS public.animals (
    id VARCHAR(30) PRIMARY KEY,
    type VARCHAR(30) NOT NULL, -- 'cow', 'chicken', 'pig', 'sheep'
    name VARCHAR(50) NOT NULL,
    hunger INT DEFAULT 50,
    last_fed_at TIMESTAMPTZ DEFAULT NOW(),
    ready_to_produce BOOLEAN DEFAULT TRUE,
    produce_type VARCHAR(30) NOT NULL,
    produce_count INT DEFAULT 1,
    position_x FLOAT DEFAULT 0,
    position_z FLOAT DEFAULT 0
);

INSERT INTO public.animals (id, type, name, hunger, ready_to_produce, produce_type, produce_count, position_x, position_z)
VALUES
    ('cow-1', 'cow', 'Mimosa', 50, TRUE, 'milk', 2, 14, -8),
    ('cow-2', 'cow', 'Estrela', 40, FALSE, 'milk', 1, 17, -11),
    ('chicken-1', 'chicken', 'Pipa', 20, TRUE, 'egg', 3, -13, -12),
    ('chicken-2', 'chicken', 'Carijó', 30, TRUE, 'egg', 2, -16, -14),
    ('pig-1', 'pig', 'Baconzinho', 60, FALSE, 'truffle', 1, 14, 12),
    ('sheep-1', 'sheep', 'Floco', 35, TRUE, 'wool', 2, -14, 11)
ON CONFLICT (id) DO NOTHING;

-- 8. Tabela de Missões da Isa (missions)
CREATE TABLE IF NOT EXISTS public.missions (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    target_count INT DEFAULT 1,
    reward_coins INT DEFAULT 50,
    reward_xp INT DEFAULT 40,
    is_community BOOLEAN DEFAULT FALSE
);

INSERT INTO public.missions (id, title, description, target_count, reward_coins, reward_xp, is_community)
VALUES
    ('mission-welcome', 'Boas-vindas da Isa', 'Converse com a Isa para receber sementes de presente!', 1, 30, 25, FALSE),
    ('mission-plant-corn', 'Plantar Milho', 'Plante 3 sementes de milho nos talhões da horta.', 3, 50, 40, FALSE),
    ('mission-harvest-corn', 'Colheita Dourada', 'Colha 3 espigas de milho prontas para o celeiro.', 3, 60, 50, FALSE),
    ('mission-feed-chicken', 'Galinhas Famintas', 'Alimente as galinhas no galinheiro e recolha ovos frescos!', 2, 70, 60, FALSE),
    ('mission-community-corn', 'Grande Colheita Coletiva', 'Ajude a comunidade a atingir a meta coletiva de milho da fazendinha!', 100, 250, 200, TRUE)
ON CONFLICT (id) DO NOTHING;

-- 9. Tabela de Metas Comunitárias (community_goals)
CREATE TABLE IF NOT EXISTS public.community_goals (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    target INT DEFAULT 100,
    current INT DEFAULT 0,
    reward_coins INT DEFAULT 200,
    reward_xp INT DEFAULT 150,
    completed BOOLEAN DEFAULT FALSE,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.community_goals (id, title, target, current, reward_coins, reward_xp, completed)
VALUES ('goal-corn', 'Grande Colheita de Milho Coletiva', 100, 34, 250, 180, FALSE)
ON CONFLICT (id) DO NOTHING;

-- 10. Tabela de Registro de Atividades e Moderação (game_events)
CREATE TABLE IF NOT EXISTS public.game_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    player_nickname VARCHAR(50),
    event_type VARCHAR(50) NOT NULL,
    details JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================================
-- SEGURANÇA E RLS (Row Level Security)
-- =====================================================================
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_world ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_plots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.animals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_events ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública para Jogadores da Fazenda
CREATE POLICY "Permitir leitura pública de jogadores" ON public.players FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de novo jogador" ON public.players FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização do próprio perfil" ON public.players FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura dos talhões" ON public.farm_plots FOR SELECT USING (true);
CREATE POLICY "Permitir atualização dos talhões" ON public.farm_plots FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura dos animais" ON public.animals FOR SELECT USING (true);
CREATE POLICY "Permitir atualização dos animais" ON public.animals FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura dos eventos" ON public.game_events FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de eventos" ON public.game_events FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir leitura de metas comunitárias" ON public.community_goals FOR SELECT USING (true);
CREATE POLICY "Permitir atualização de metas comunitárias" ON public.community_goals FOR UPDATE USING (true);

CREATE POLICY "Permitir leitura de culturas e missões" ON public.crops FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de missões" ON public.missions FOR SELECT USING (true);

-- =====================================================================
-- 11. SISTEMA DE COMPRA DE TERRAS E EXPANSÃO (farm_land)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.farm_land (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    size_category VARCHAR(30) NOT NULL,
    price INT NOT NULL,
    area_m2 INT NOT NULL,
    unlock_level INT DEFAULT 1,
    owner_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    owner_name VARCHAR(50),
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'owned', 'locked'
    coord_x FLOAT NOT NULL,
    coord_z FLOAT NOT NULL,
    width FLOAT NOT NULL,
    depth FLOAT NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO public.farm_land (id, name, description, size_category, price, area_m2, unlock_level, coord_x, coord_z, width, depth)
VALUES
    ('land-lake', 'Terreno Lago Encantado', 'Belo terreno beira-lago com terra fértil.', 'lake_special', 150, 120, 1, 36, -20, 14, 14),
    ('land-orchard', 'Colina das Macieiras', 'Próximo ao pomar, ideal para plantações e frutas.', 'medium', 250, 180, 2, 36, 18, 16, 16),
    ('land-pasture', 'Pasto dos Sonhos', 'Espaçoso para animais e celeiros.', 'pasture_special', 350, 220, 2, -36, -15, 16, 16),
    ('land-crop', 'Grande Safra Fértil', 'Terra roxa fértil para plantio massivo de milho.', 'crop_special', 500, 300, 3, 0, 28, 20, 16),
    ('land-lakeview', 'Mirante Bela Vista', 'O maior terreno da fazenda com visão privilegiada.', 'large', 800, 450, 4, -36, 22, 18, 18)
ON CONFLICT (id) DO NOTHING;

-- 12. Tabela de Construções nos Terrenos (farm_constructions)
CREATE TABLE IF NOT EXISTS public.farm_constructions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_id VARCHAR(50) REFERENCES public.farm_land(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    construction_type VARCHAR(30) NOT NULL, -- 'fence', 'shed', 'animal_pen', 'garden_bed', 'lantern'
    label VARCHAR(50),
    pos_x FLOAT NOT NULL,
    pos_z FLOAT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Tabela do Mercado da Fazendinha (market_listings)
CREATE TABLE IF NOT EXISTS public.market_listings (
    id VARCHAR(50) PRIMARY KEY,
    seller_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    seller_name VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(50) NOT NULL,
    icon VARCHAR(10) DEFAULT '🌾',
    quantity INT NOT NULL CHECK (quantity > 0),
    price_per_unit INT NOT NULL CHECK (price_per_unit > 0),
    total_price INT NOT NULL,
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'sold', 'cancelled'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 14. Transações Comerciais do Mercado (market_transactions)
CREATE TABLE IF NOT EXISTS public.market_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    listing_id VARCHAR(50),
    buyer_id UUID REFERENCES public.players(id),
    buyer_name VARCHAR(50) NOT NULL,
    seller_id UUID REFERENCES public.players(id),
    seller_name VARCHAR(50) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    quantity INT NOT NULL,
    total_cost INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Carteira e Histórico Financeiro dos Jogadores (player_wallet)
CREATE TABLE IF NOT EXISTS public.player_wallet (
    player_id UUID PRIMARY KEY REFERENCES public.players(id) ON DELETE CASCADE,
    balance INT DEFAULT 100 CHECK (balance >= 0),
    total_earned INT DEFAULT 100,
    total_spent INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    type VARCHAR(30) NOT NULL, -- 'earn_harvest', 'earn_market', 'spend_seed', 'spend_land', 'spend_construction'
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Eventos de Reação da ISA (isa_reactions)
CREATE TABLE IF NOT EXISTS public.isa_reactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.players(id) ON DELETE SET NULL,
    event_type VARCHAR(50) NOT NULL,
    isa_speech TEXT NOT NULL,
    animation_state VARCHAR(30) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para novas tabelas
-- 17. Tabela de Compradores Automáticos do Mercado (market_buyers)
CREATE TABLE IF NOT EXISTS public.market_buyers (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    role VARCHAR(80) NOT NULL,
    avatar VARCHAR(30) DEFAULT 'bento',
    icon VARCHAR(10) DEFAULT '👨‍🌾',
    personality TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 18. Tabela de Pedidos dos Compradores (market_orders)
CREATE TABLE IF NOT EXISTS public.market_orders (
    id VARCHAR(50) PRIMARY KEY,
    buyer_id VARCHAR(50) REFERENCES public.market_buyers(id) ON DELETE CASCADE,
    dialogue TEXT,
    reward_coins INT NOT NULL,
    reward_xp INT NOT NULL,
    status VARCHAR(20) DEFAULT 'available', -- 'available', 'fulfilled', 'cooldown'
    fulfilled_by UUID REFERENCES public.players(id),
    fulfilled_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.market_order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id VARCHAR(50) REFERENCES public.market_orders(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(80) NOT NULL,
    icon VARCHAR(10) DEFAULT '🌾',
    quantity INT NOT NULL CHECK (quantity > 0)
);

-- RLS
ALTER TABLE public.market_buyers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Permitir leitura de compradores" ON public.market_buyers FOR SELECT USING (true);
CREATE POLICY "Permitir leitura de pedidos" ON public.market_orders FOR SELECT USING (true);
CREATE POLICY "Permitir atualização de pedidos" ON public.market_orders FOR UPDATE USING (true);
CREATE POLICY "Permitir leitura de itens de pedidos" ON public.market_order_items FOR SELECT USING (true);

-- =====================================================================
-- 19. BARRACAS DO MERCADO (market_stalls)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.market_stalls (
    id VARCHAR(50) PRIMARY KEY,
    owner_id UUID REFERENCES public.players(id) ON DELETE CASCADE,
    stall_name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(owner_id)
);

ALTER TABLE public.market_stalls ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de barracas" ON public.market_stalls FOR SELECT USING (true);
CREATE POLICY "Permitir atualização da própria barraca" ON public.market_stalls FOR ALL USING (true);

-- =====================================================================
-- 20. CATÁLOGO DE PRODUTOS DO MERCADO (market_products)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.market_products (
    product_id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    category VARCHAR(30) NOT NULL,
    icon VARCHAR(10) NOT NULL,
    description TEXT,
    min_price INT DEFAULT 5,
    recommended_price INT DEFAULT 20,
    max_price INT DEFAULT 100,
    growth_seconds INT DEFAULT 25,
    seed_cost INT DEFAULT 10
);

ALTER TABLE public.market_products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Permitir leitura de produtos do mercado" ON public.market_products FOR SELECT USING (true);

INSERT INTO public.market_products (product_id, name, category, icon, description, min_price, recommended_price, max_price, growth_seconds, seed_cost)
VALUES
    ('corn', 'Milho Dourado', 'crop', '🌽', 'Milho doce e macio recém-colhido da roça.', 10, 25, 60, 25, 10),
    ('carrot', 'Cenoura Crocante', 'crop', '🥕', 'Cenoura fresca e rica em vitaminas.', 8, 20, 50, 20, 8),
    ('tomato', 'Tomate Vermelhinho', 'crop', '🍅', 'Tomate suculento ideal para saladas.', 12, 30, 70, 30, 12),
    ('pumpkin', 'Abóbora Gigante', 'crop', '🎃', 'Abóbora saborosa para doces e sopas.', 20, 55, 120, 40, 25),
    ('strawberry', 'Morango Doce', 'crop', '🍓', 'Morango orgânico super perfumado.', 18, 45, 110, 35, 20),
    ('milk', 'Leite Fresco', 'product', '🥛', 'Leite puro tirado da vaquinha Mimosa.', 15, 35, 80, 0, 0),
    ('egg', 'Ovos Caipiras', 'product', '🥚', 'Ovos frescos do galinheiro da fazendinha.', 10, 25, 60, 0, 0),
    ('wool', 'Lã Macia', 'product', '🧶', 'Lã quentinha tosquiada da ovelha Floco.', 20, 50, 100, 0, 0),
    ('truffle', 'Trufa Rara', 'product', '🍄', 'Trufa aromática encontrada pelo porquinho.', 40, 90, 200, 0, 0)
ON CONFLICT (product_id) DO UPDATE SET
    name = EXCLUDED.name,
    category = EXCLUDED.category,
    icon = EXCLUDED.icon,
    description = EXCLUDED.description;

-- Inicializar 8 talhões padrão na fazenda se vazios
INSERT INTO public.farm_plots (id, crop_type, stage, is_watered, growth_duration_seconds)
VALUES
    (0, 'corn', 3, true, 25),
    (1, 'corn', 3, true, 25),
    (2, 'carrot', 2, true, 20),
    (3, 'tomato', 3, true, 30),
    (4, 'corn', 1, false, 25),
    (5, NULL, 0, false, 25),
    (6, NULL, 0, false, 25),
    (7, NULL, 0, false, 25)
ON CONFLICT (id) DO NOTHING;

-- =====================================================================
-- 21. STORED PROCEDURES & RPC FUNCTIONS (SUPABASE)
-- =====================================================================

-- 21.1 market_ensure_player: Garante criação do perfil, carteira e sementes iniciais
CREATE OR REPLACE FUNCTION public.market_ensure_player()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_nickname TEXT;
    v_avatar TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    v_nickname := coalesce(
        current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'nickname',
        'Fazendeiro'
    );
    v_avatar := coalesce(
        current_setting('request.jwt.claims', true)::jsonb -> 'user_metadata' ->> 'avatar_id',
        'leo'
    );

    -- Inserir jogador caso não exista
    INSERT INTO public.players (id, nickname, avatar, level, experience, coins)
    VALUES (v_uid, v_nickname, v_avatar, 1, 0, 100)
    ON CONFLICT (id) DO UPDATE SET
        last_seen_at = NOW();

    -- Inserir jogador oficial de mercado
    INSERT INTO public.market_players (id, nickname, avatar, level, experience, created_at, updated_at)
    VALUES (v_uid, v_nickname, v_avatar, 1, 0, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        nickname = EXCLUDED.nickname,
        avatar = EXCLUDED.avatar,
        updated_at = NOW();

    -- Inserir carteira caso não exista (carteira legada)
    INSERT INTO public.player_wallet (player_id, balance, total_earned, total_spent)
    VALUES (v_uid, 100, 100, 0)
    ON CONFLICT (player_id) DO NOTHING;

    -- Inserir carteira de mercado sem concessão de moedas arbitrárias
    INSERT INTO public.market_wallets (player_id, balance, total_earned, total_spent, updated_at)
    VALUES (v_uid, 0, 0, 0, NOW())
    ON CONFLICT (player_id) DO NOTHING;

    -- Inserir reputação comercial com pontuação inicial de 100.00
    INSERT INTO public.market_farm_reputation (seller_id, reputation_score, total_sales, total_visits, missed_sales, last_visit_at, updated_at)
    VALUES (v_uid, 100.00, 0, 0, 0, NOW(), NOW())
    ON CONFLICT (seller_id) DO NOTHING;

    -- Inserir sementes iniciais caso inventário esteja vazio
    IF NOT EXISTS (SELECT 1 FROM public.player_inventory WHERE player_id = v_uid) THEN
        INSERT INTO public.player_inventory (player_id, item_id, category, quantity)
        VALUES
            (v_uid, 'corn_seed', 'seed', 5),
            (v_uid, 'carrot_seed', 'seed', 5),
            (v_uid, 'tomato_seed', 'seed', 3),
            (v_uid, 'feed', 'tool', 4)
        ON CONFLICT (player_id, item_id) DO NOTHING;
    END IF;

    -- Inserir barraca caso não exista
    INSERT INTO public.market_stalls (id, owner_id, stall_name)
    VALUES ('stall-' || substr(v_uid::text, 1, 8), v_uid, 'Barraca de ' || v_nickname)
    ON CONFLICT (owner_id) DO NOTHING;

    RETURN jsonb_build_object('success', true);
END;
$$;

-- 21.2 market_state: Retorna o snapshot completo de estado para o jogador ativo
CREATE OR REPLACE FUNCTION public.market_state()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_player RECORD;
    v_wallet RECORD;
    v_stall RECORD;
    v_inventory JSONB;
    v_products JSONB;
    v_listings JSONB;
    v_plots JSONB;
    v_lands JSONB;
    v_owned_lands JSONB;
    v_reputation JSONB;
    v_notifications JSONB;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    PERFORM public.market_ensure_player();

    SELECT id, nickname, avatar as avatar_id INTO v_player FROM public.players WHERE id = v_uid;
    SELECT balance as coins INTO v_wallet FROM public.player_wallet WHERE player_id = v_uid;
    SELECT id, owner_id, stall_name INTO v_stall FROM public.market_stalls WHERE owner_id = v_uid;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'item_id', item_id,
        'quantity', quantity
    )), '[]'::jsonb) INTO v_inventory
    FROM public.player_inventory
    WHERE player_id = v_uid;

    SELECT coalesce(jsonb_agg(to_jsonb(p)), '[]'::jsonb) INTO v_products
    FROM public.market_products p;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', l.id,
        'stall_id', coalesce(s.id, 'stall-' || substr(l.seller_id::text, 1, 8)),
        'seller_id', l.seller_id,
        'seller_name', l.seller_name,
        'stall_name', coalesce(s.stall_name, 'Barraca de ' || l.seller_name),
        'product_id', l.product_id,
        'product_name', l.product_name,
        'icon', l.icon,
        'category', coalesce(mp.category, 'crop'),
        'quantity', l.quantity,
        'price_per_unit', l.price_per_unit,
        'sold_count', 0,
        'updated_at', to_char(l.created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    )), '[]'::jsonb) INTO v_listings
    FROM public.market_listings l
    LEFT JOIN public.market_stalls s ON s.owner_id = l.seller_id
    LEFT JOIN public.market_products mp ON mp.product_id = l.product_id
    WHERE l.status = 'active';

    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', id,
        'cropType', crop_type,
        'stage', stage,
        'watered', is_watered,
        'plantedAt', to_char(planted_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"'),
        'growthTime', growth_duration_seconds,
        'ownerId', planted_by
    ) ORDER BY id ASC), '[]'::jsonb) INTO v_plots
    FROM public.farm_plots;

    SELECT coalesce(jsonb_agg(jsonb_build_object(
        'id', id,
        'name', name,
        'price', price,
        'owner_id', owner_id
    )), '[]'::jsonb) INTO v_lands
    FROM public.farm_land;

    SELECT coalesce(jsonb_agg(id), '[]'::jsonb) INTO v_owned_lands
    FROM public.farm_land
    WHERE owner_id = v_uid;

    SELECT to_jsonb(r) INTO v_reputation
    FROM public.market_farm_reputation r
    WHERE seller_id = v_uid;

    SELECT coalesce(jsonb_agg(to_jsonb(n)), '[]'::jsonb) INTO v_notifications
    FROM (
        SELECT id, product_id, notification_type, message, read, to_char(created_at, 'YYYY-MM-DD"T"HH24:MI:SS"Z"') as created_at
        FROM public.market_stock_notifications
        WHERE seller_id = v_uid
        ORDER BY created_at DESC
        LIMIT 10
    ) n;

    RETURN jsonb_build_object(
        'player', jsonb_build_object('id', v_player.id, 'nickname', v_player.nickname, 'avatar_id', v_player.avatar_id),
        'wallet', jsonb_build_object('coins', coalesce(v_wallet.coins, 100)),
        'inventory', v_inventory,
        'stall', CASE WHEN v_stall.id IS NOT NULL THEN to_jsonb(v_stall) ELSE NULL END,
        'products', v_products,
        'listings', v_listings,
        'transactions', '[]'::jsonb,
        'farm_plots', v_plots,
        'lands', v_lands,
        'owned_land_ids', v_owned_lands,
        'reputation', coalesce(v_reputation, jsonb_build_object('reputation_score', 100.00, 'total_sales', 0, 'total_visits', 0, 'missed_sales', 0)),
        'notifications', v_notifications,
        'npc_budget_remaining', 1000
    );
END;
$$;

-- 21.3 market_farm_action: Executa plantio, rega ou colheita
CREATE OR REPLACE FUNCTION public.market_farm_action(
    p_plot_id INT,
    p_action TEXT,
    p_crop_type TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_seed_id TEXT;
    v_seed_count INT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    IF p_action = 'plant' THEN
        IF p_crop_type IS NULL THEN
            RAISE EXCEPTION 'Tipo de cultivo não informado';
        END IF;

        v_seed_id := p_crop_type || '_seed';
        SELECT quantity INTO v_seed_count FROM public.player_inventory
        WHERE player_id = v_uid AND item_id = v_seed_id;

        IF v_seed_count IS NULL OR v_seed_count < 1 THEN
            RAISE EXCEPTION 'Você não tem sementes de % suficientes', p_crop_type;
        END IF;

        -- Consumir 1 semente
        UPDATE public.player_inventory
        SET quantity = quantity - 1
        WHERE player_id = v_uid AND item_id = v_seed_id;

        -- Atualizar talhão
        UPDATE public.farm_plots
        SET crop_type = p_crop_type,
            stage = 1,
            is_watered = false,
            planted_by = v_uid,
            planted_at = NOW(),
            updated_at = NOW()
        WHERE id = p_plot_id;

    ELSIF p_action = 'water' THEN
        UPDATE public.farm_plots
        SET is_watered = true,
            updated_at = NOW()
        WHERE id = p_plot_id;

    ELSIF p_action = 'harvest' THEN
        -- Colher e dar produto ao jogador
        DECLARE
            v_plot_crop TEXT;
            v_plot_stage INT;
        BEGIN
            SELECT crop_type, stage INTO v_plot_crop, v_plot_stage
            FROM public.farm_plots WHERE id = p_plot_id;

            IF v_plot_crop IS NOT NULL THEN
                INSERT INTO public.player_inventory (player_id, item_id, category, quantity)
                VALUES (v_uid, v_plot_crop, 'crop', 2)
                ON CONFLICT (player_id, item_id) DO UPDATE SET
                    quantity = player_inventory.quantity + 2;

                -- Resetar talhão
                UPDATE public.farm_plots
                SET crop_type = NULL,
                    stage = 0,
                    is_watered = false,
                    planted_by = NULL,
                    planted_at = NULL,
                    updated_at = NOW()
                WHERE id = p_plot_id;
            END IF;
        END;
    END IF;

    RETURN public.market_state();
END;
$$;

-- 21.4 market_buy_seed: Compra sementes na loja
CREATE OR REPLACE FUNCTION public.market_buy_seed(p_crop_type TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_cost INT;
    v_balance INT;
    v_seed_id TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    SELECT seed_cost INTO v_cost FROM public.crops WHERE id = p_crop_type;
    IF v_cost IS NULL THEN v_cost := 10; END IF;

    SELECT balance INTO v_balance FROM public.player_wallet WHERE player_id = v_uid;
    IF v_balance IS NULL OR v_balance < v_cost THEN
        RAISE EXCEPTION 'Moedas insuficientes';
    END IF;

    UPDATE public.player_wallet
    SET balance = balance - v_cost,
        total_spent = total_spent + v_cost,
        updated_at = NOW()
    WHERE player_id = v_uid;

    v_seed_id := p_crop_type || '_seed';
    INSERT INTO public.player_inventory (player_id, item_id, category, quantity)
    VALUES (v_uid, v_seed_id, 'seed', 1)
    ON CONFLICT (player_id, item_id) DO UPDATE SET
        quantity = player_inventory.quantity + 1;

    RETURN public.market_state();
END;
$$;

-- 21.5 market_buy_feed: Compra ração para os animais
CREATE OR REPLACE FUNCTION public.market_buy_feed()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_cost INT := 10;
    v_balance INT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    SELECT balance INTO v_balance FROM public.player_wallet WHERE player_id = v_uid;
    IF v_balance IS NULL OR v_balance < v_cost THEN
        RAISE EXCEPTION 'Moedas insuficientes';
    END IF;

    UPDATE public.player_wallet
    SET balance = balance - v_cost,
        total_spent = total_spent + v_cost,
        updated_at = NOW()
    WHERE player_id = v_uid;

    INSERT INTO public.player_inventory (player_id, item_id, category, quantity)
    VALUES (v_uid, 'feed', 'tool', 2)
    ON CONFLICT (player_id, item_id) DO UPDATE SET
        quantity = player_inventory.quantity + 2;

    RETURN public.market_state();
END;
$$;

-- 21.6 market_restock: Coloca produtos à venda na barraca do mercado
CREATE OR REPLACE FUNCTION public.market_restock(
    p_product_id TEXT,
    p_quantity INT,
    p_unit_price INT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_stock INT;
    v_player_name TEXT;
    v_prod_name TEXT;
    v_prod_icon TEXT;
    v_listing_id TEXT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    IF p_quantity < 1 THEN
        RAISE EXCEPTION 'Quantidade inválida';
    END IF;

    SELECT quantity INTO v_stock FROM public.player_inventory
    WHERE player_id = v_uid AND item_id = p_product_id;

    IF v_stock IS NULL OR v_stock < p_quantity THEN
        RAISE EXCEPTION 'Você não possui quantidade suficiente deste item no inventário';
    END IF;

    UPDATE public.player_inventory
    SET quantity = quantity - p_quantity
    WHERE player_id = v_uid AND item_id = p_product_id;

    SELECT nickname INTO v_player_name FROM public.players WHERE id = v_uid;
    SELECT name, icon INTO v_prod_name, v_prod_icon FROM public.market_products WHERE product_id = p_product_id;
    IF v_prod_name IS NULL THEN v_prod_name := p_product_id; v_prod_icon := '📦'; END IF;

    v_listing_id := 'list-' || substr(uuid_generate_v4()::text, 1, 8);
    INSERT INTO public.market_listings (id, seller_id, seller_name, product_id, product_name, icon, quantity, price_per_unit, total_price, status)
    VALUES (v_listing_id, v_uid, coalesce(v_player_name, 'Fazendeiro'), p_product_id, v_prod_name, v_prod_icon, p_quantity, p_unit_price, p_quantity * p_unit_price, 'active');

    RETURN public.market_state();
END;
$$;

-- 21.7 market_buy: Compra item anunciado no mercado por outro jogador
CREATE OR REPLACE FUNCTION public.market_buy(
    p_stall_id TEXT,
    p_product_id TEXT,
    p_quantity INT,
    p_idempotency_key TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_listing RECORD;
    v_total_cost INT;
    v_buyer_balance INT;
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    SELECT * INTO v_listing FROM public.market_listings
    WHERE product_id = p_product_id AND status = 'active' AND quantity >= p_quantity
    LIMIT 1;

    IF v_listing.id IS NULL THEN
        RAISE EXCEPTION 'Anúncio não encontrado ou estoque esgotado';
    END IF;

    IF v_listing.seller_id = v_uid THEN
        RAISE EXCEPTION 'Não pode comprar da própria barraca';
    END IF;

    v_total_cost := v_listing.price_per_unit * p_quantity;
    SELECT balance INTO v_buyer_balance FROM public.player_wallet WHERE player_id = v_uid;

    IF v_buyer_balance IS NULL OR v_buyer_balance < v_total_cost THEN
        RAISE EXCEPTION 'Moedas insuficientes';
    END IF;

    -- Debitar comprador
    UPDATE public.player_wallet
    SET balance = balance - v_total_cost,
        total_spent = total_spent + v_total_cost,
        updated_at = NOW()
    WHERE player_id = v_uid;

    -- Creditar vendedor
    UPDATE public.player_wallet
    SET balance = balance + v_total_cost,
        total_earned = total_earned + v_total_cost,
        updated_at = NOW()
    WHERE player_id = v_listing.seller_id;

    -- Dar produto ao comprador
    INSERT INTO public.player_inventory (player_id, item_id, category, quantity)
    VALUES (v_uid, p_product_id, 'product', p_quantity)
    ON CONFLICT (player_id, item_id) DO UPDATE SET
        quantity = player_inventory.quantity + p_quantity;

    -- Atualizar anúncio
    IF v_listing.quantity = p_quantity THEN
        UPDATE public.market_listings SET status = 'sold', quantity = 0 WHERE id = v_listing.id;
    ELSE
        UPDATE public.market_listings SET quantity = quantity - p_quantity, total_price = (quantity - p_quantity) * price_per_unit WHERE id = v_listing.id;
    END IF;

    RETURN jsonb_build_object(
        'success', true,
        'state', public.market_state(),
        'duplicate', false
    );
END;
$$;

-- =====================================================================
-- 22. SISTEMA REAL DE NPCS COMPRADORES E REPUTAÇÃO (bwfldkhbcevauosxvmwr)
-- =====================================================================

-- 22.1 Tabela de Jogadores Oficiais do Mercado (market_players)
CREATE TABLE IF NOT EXISTS public.market_players (
    id UUID PRIMARY KEY,
    nickname VARCHAR(80) NOT NULL DEFAULT 'Fazendeiro',
    avatar VARCHAR(30) NOT NULL DEFAULT 'leo',
    level INT NOT NULL DEFAULT 1,
    experience INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_players ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de jogadores do mercado" ON public.market_players;
CREATE POLICY "Permitir leitura de jogadores do mercado" ON public.market_players FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir cadastro de jogador do mercado" ON public.market_players;
CREATE POLICY "Permitir cadastro de jogador do mercado" ON public.market_players FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Permitir atualizar próprio jogador do mercado" ON public.market_players;
CREATE POLICY "Permitir atualizar próprio jogador do mercado" ON public.market_players FOR UPDATE USING (auth.uid() = id);

-- 22.2 Tabela de Carteiras do Mercado (market_wallets)
-- Não concede bônus de moedas adicionais; o saldo cresce através de transações reais.
CREATE TABLE IF NOT EXISTS public.market_wallets (
    player_id UUID PRIMARY KEY REFERENCES public.market_players(id) ON DELETE CASCADE,
    balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INT NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
    total_spent INT NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_wallets ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura da própria carteira de mercado" ON public.market_wallets;
CREATE POLICY "Permitir leitura da própria carteira de mercado" ON public.market_wallets FOR SELECT USING (auth.uid() = player_id);
-- Mutações financeiras são gerenciadas exclusivamente por procedimentos autorizados (SECURITY DEFINER)

-- 22.3 Tabela de Perfis dos NPCs Compradores (market_npc_profiles)
CREATE TABLE IF NOT EXISTS public.market_npc_profiles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(80) NOT NULL,
    role VARCHAR(80) NOT NULL,
    avatar VARCHAR(30) DEFAULT 'bento',
    icon VARCHAR(10) DEFAULT '👨‍🌾',
    preferred_category VARCHAR(30) NOT NULL, -- 'crop', 'product', 'grains', 'fruits', 'dairy'
    max_unit_price INT DEFAULT 50,
    daily_budget INT DEFAULT 500,
    budget_remaining INT DEFAULT 500,
    personality TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_npc_profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de perfis de NPCs" ON public.market_npc_profiles;
CREATE POLICY "Permitir leitura de perfis de NPCs" ON public.market_npc_profiles FOR SELECT USING (true);

-- 22.4 Tabela de Orçamento dos NPCs (market_npc_budget)
CREATE TABLE IF NOT EXISTS public.market_npc_budget (
    npc_id VARCHAR(50) PRIMARY KEY REFERENCES public.market_npc_profiles(id) ON DELETE CASCADE,
    daily_budget INT NOT NULL DEFAULT 500 CHECK (daily_budget >= 0),
    budget_remaining INT NOT NULL DEFAULT 500 CHECK (budget_remaining >= 0),
    last_reset_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_npc_budget ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de orçamento de NPCs" ON public.market_npc_budget;
CREATE POLICY "Permitir leitura de orçamento de NPCs" ON public.market_npc_budget FOR SELECT USING (true);

-- Cadastro dos 5 Perfis Oficiais de NPCs Inteligentes
INSERT INTO public.market_npc_profiles (id, name, role, avatar, icon, preferred_category, max_unit_price, daily_budget, budget_remaining, personality)
VALUES
    ('npc-antonio', 'Seu Antônio', 'Comerciante de Grãos e Milho', 'bento', '👨‍🌾', 'crop', 35, 600, 600, 'Exigente com grãos frescos e milho amarelo graúdo para abastecer o moinho da vila.'),
    ('npc-francisca', 'Dona Francisca', 'Quituteira da Fazenda', 'aninha', '👵', 'crop', 40, 500, 500, 'Procura cenouras crocantes, morangos e abóboras para quitutes, compotas e bolos caseiros.'),
    ('npc-tiao', 'Tião dos Grãos', 'Atacadista Regional', 'davi', '🚚', 'grains', 45, 800, 800, 'Compra grãos em grande volume (soja, trigo, feijão e milho) para distribuição nas cooperativas.'),
    ('npc-celia', 'Dona Célia', 'Merceeira de Hortaliças', 'mel', '🥗', 'crop', 30, 450, 450, 'Prioriza hortaliças colhidas no dia, tomates vermelhos e produtos com excelente apresentação visual.'),
    ('npc-ze', 'Seu Zé', 'Ranqueiro e Queijeiro', 'kaua', '🧀', 'product', 55, 650, 650, 'Busca laticínios frescos, ovos caipiras e lã macia para confecção de queijos e mantas artesanais.')
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    avatar = EXCLUDED.avatar,
    icon = EXCLUDED.icon,
    preferred_category = EXCLUDED.preferred_category,
    max_unit_price = EXCLUDED.max_unit_price,
    daily_budget = EXCLUDED.daily_budget,
    personality = EXCLUDED.personality,
    updated_at = NOW();

INSERT INTO public.market_npc_budget (npc_id, daily_budget, budget_remaining)
SELECT id, daily_budget, budget_remaining
FROM public.market_npc_profiles
ON CONFLICT (npc_id) DO UPDATE SET
    daily_budget = EXCLUDED.daily_budget,
    updated_at = NOW();

-- 22.5 Tabela de Estoque Real das Barracas (market_inventory)
CREATE TABLE IF NOT EXISTS public.market_inventory (
    id VARCHAR(50) PRIMARY KEY,
    stall_id VARCHAR(50),
    seller_id UUID REFERENCES public.market_players(id) ON DELETE CASCADE,
    seller_name VARCHAR(80) NOT NULL,
    product_id VARCHAR(50) NOT NULL,
    product_name VARCHAR(80) NOT NULL,
    category VARCHAR(30) NOT NULL DEFAULT 'crop',
    icon VARCHAR(10) DEFAULT '🌾',
    quantity INT NOT NULL CHECK (quantity >= 0),
    unit_price INT NOT NULL CHECK (unit_price > 0),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de estoque do mercado" ON public.market_inventory;
CREATE POLICY "Permitir leitura de estoque do mercado" ON public.market_inventory FOR SELECT USING (true);
DROP POLICY IF EXISTS "Permitir vendedor cadastrar estoque" ON public.market_inventory;
CREATE POLICY "Permitir vendedor cadastrar estoque" ON public.market_inventory FOR INSERT WITH CHECK (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Permitir vendedor atualizar próprio estoque" ON public.market_inventory;
CREATE POLICY "Permitir vendedor atualizar próprio estoque" ON public.market_inventory FOR UPDATE USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Permitir vendedor remover próprio estoque" ON public.market_inventory;
CREATE POLICY "Permitir vendedor remover próprio estoque" ON public.market_inventory FOR DELETE USING (auth.uid() = seller_id);

-- 22.6 Livro Razão Financeiro Oficial (market_wallet_ledger)
CREATE TABLE IF NOT EXISTS public.market_wallet_ledger (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player_id UUID REFERENCES public.market_players(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    balance_after INT NOT NULL,
    transaction_type VARCHAR(50) NOT NULL, -- 'npc_purchase', 'p2p_purchase', 'market_sale'
    reference_id VARCHAR(100),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_wallet_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura do livro caixa" ON public.market_wallet_ledger;
CREATE POLICY "Permitir leitura do livro caixa" ON public.market_wallet_ledger FOR SELECT USING (auth.uid() = player_id);

-- 22.7 Tabela de Reputação Comercial das Fazendas (market_farm_reputation)
CREATE TABLE IF NOT EXISTS public.market_farm_reputation (
    seller_id UUID PRIMARY KEY REFERENCES public.market_players(id) ON DELETE CASCADE,
    reputation_score NUMERIC(5,2) NOT NULL DEFAULT 100.00 CHECK (reputation_score >= 0.00 AND reputation_score <= 100.00),
    total_sales INT NOT NULL DEFAULT 0 CHECK (total_sales >= 0),
    total_visits INT NOT NULL DEFAULT 0 CHECK (total_visits >= 0),
    missed_sales INT NOT NULL DEFAULT 0 CHECK (missed_sales >= 0),
    last_visit_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_farm_reputation ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de reputação comercial" ON public.market_farm_reputation;
CREATE POLICY "Permitir leitura de reputação comercial" ON public.market_farm_reputation FOR SELECT USING (true);

-- 22.8 Registro de Visitas dos NPCs às Barracas (market_npc_visits)
CREATE TABLE IF NOT EXISTS public.market_npc_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    npc_id VARCHAR(50) NOT NULL REFERENCES public.market_npc_profiles(id) ON DELETE CASCADE,
    seller_id UUID NOT NULL REFERENCES public.market_players(id) ON DELETE CASCADE,
    stall_id VARCHAR(50),
    product_id VARCHAR(50) NOT NULL,
    action_result VARCHAR(30) NOT NULL CHECK (action_result IN ('purchased', 'out_of_stock', 'price_too_high', 'budget_exhausted')),
    quantity INT DEFAULT 1,
    unit_price INT,
    total_cost INT,
    reputation_impact NUMERIC(4,2) DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_npc_visits_cooldown ON public.market_npc_visits (seller_id, npc_id, product_id, created_at DESC);

ALTER TABLE public.market_npc_visits ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura das visitas de NPCs pelo vendedor" ON public.market_npc_visits;
CREATE POLICY "Permitir leitura das visitas de NPCs pelo vendedor" ON public.market_npc_visits FOR SELECT USING (auth.uid() = seller_id);

-- 22.9 Notificações de Estoque e Reputação (market_stock_notifications)
CREATE TABLE IF NOT EXISTS public.market_stock_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    seller_id UUID NOT NULL REFERENCES public.market_players(id) ON DELETE CASCADE,
    product_id VARCHAR(50) NOT NULL,
    notification_type VARCHAR(50) NOT NULL CHECK (notification_type IN ('out_of_stock', 'low_stock', 'sale_completed', 'reputation_alert')),
    message TEXT NOT NULL,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stock_notif_cooldown ON public.market_stock_notifications (seller_id, product_id, notification_type, created_at DESC);

ALTER TABLE public.market_stock_notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Permitir leitura de notificações pelo vendedor" ON public.market_stock_notifications;
CREATE POLICY "Permitir leitura de notificações pelo vendedor" ON public.market_stock_notifications FOR SELECT USING (auth.uid() = seller_id);
DROP POLICY IF EXISTS "Permitir vendedor marcar notificação como lida" ON public.market_stock_notifications;
CREATE POLICY "Permitir vendedor marcar notificação como lida" ON public.market_stock_notifications FOR UPDATE USING (auth.uid() = seller_id);

-- 22.10 Sincronização retroativa de perfis já existentes no banco
INSERT INTO public.market_players (id, nickname, avatar, level, experience, created_at, updated_at)
SELECT id, nickname, avatar, level, experience, created_at, NOW()
FROM public.players
ON CONFLICT (id) DO UPDATE SET
    nickname = EXCLUDED.nickname,
    avatar = EXCLUDED.avatar,
    updated_at = NOW();

INSERT INTO public.market_wallets (player_id, balance, total_earned, total_spent, updated_at)
SELECT id, coins, coins, 0, NOW()
FROM public.players
ON CONFLICT (player_id) DO NOTHING;

INSERT INTO public.market_farm_reputation (seller_id, reputation_score, total_sales, total_visits, missed_sales)
SELECT id, 100.00, 0, 0, 0
FROM public.players
ON CONFLICT (seller_id) DO NOTHING;

-- 22.11 FUNÇÃO CENTRAL: market_process_npc_purchase
-- Preserva estritamente a assinatura oficial e compatibilidade com o cron agendado.
CREATE OR REPLACE FUNCTION public.market_process_npc_purchase(
    p_npc_id TEXT DEFAULT NULL,
    p_inventory_id TEXT DEFAULT NULL,
    p_quantity INT DEFAULT 1
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_npc RECORD;
    v_item RECORD;
    v_qty_to_buy INT;
    v_total_price INT;
    v_tx_id UUID;
    v_new_balance INT;
    v_reputation_gain NUMERIC(4,2) := 0.50;
    v_reputation_penalty NUMERIC(4,2) := 1.00;
BEGIN
    -- 1. Seleção do NPC comprador com bloqueio de concorrência (FOR UPDATE)
    IF p_npc_id IS NULL THEN
        SELECT p.id, p.name, p.role, p.avatar, p.icon, p.preferred_category, p.max_unit_price, p.personality,
               b.daily_budget, b.budget_remaining
        INTO v_npc
        FROM public.market_npc_profiles p
        JOIN public.market_npc_budget b ON b.npc_id = p.id
        WHERE b.budget_remaining > 0
        ORDER BY RANDOM()
        LIMIT 1
        FOR UPDATE OF b;
    ELSE
        SELECT p.id, p.name, p.role, p.avatar, p.icon, p.preferred_category, p.max_unit_price, p.personality,
               b.daily_budget, b.budget_remaining
        INTO v_npc
        FROM public.market_npc_profiles p
        JOIN public.market_npc_budget b ON b.npc_id = p.id
        WHERE p.id = p_npc_id
        FOR UPDATE OF b;
    END IF;

    IF v_npc.id IS NULL OR v_npc.budget_remaining <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'no_eligible_npc_with_budget'
        );
    END IF;

    -- 2. Localização e avaliação de estoque
    IF p_inventory_id IS NOT NULL THEN
        -- Visita direcionada a uma barraca/item específico
        SELECT * INTO v_item
        FROM public.market_inventory
        WHERE id = p_inventory_id
        FOR UPDATE;

        IF v_item.id IS NOT NULL AND v_item.quantity <= 0 THEN
            -- NPC visitou a barraca e o produto estava esgotado:
            -- Aplica penalidade somente se não penalizou este vendedor pelo mesmo produto nos últimos 3 minutos (Deduplicação)
            IF NOT EXISTS (
                SELECT 1 FROM public.market_npc_visits
                WHERE seller_id = v_item.seller_id
                  AND npc_id = v_npc.id
                  AND product_id = v_item.product_id
                  AND action_result = 'out_of_stock'
                  AND created_at >= NOW() - INTERVAL '3 minutes'
            ) THEN
                UPDATE public.market_farm_reputation
                SET reputation_score = GREATEST(0.00, reputation_score - v_reputation_penalty),
                    missed_sales = missed_sales + 1,
                    total_visits = total_visits + 1,
                    last_visit_at = NOW(),
                    updated_at = NOW()
                WHERE seller_id = v_item.seller_id;

                IF NOT EXISTS (
                    SELECT 1 FROM public.market_stock_notifications
                    WHERE seller_id = v_item.seller_id
                      AND product_id = v_item.product_id
                      AND notification_type = 'out_of_stock'
                      AND created_at >= NOW() - INTERVAL '5 minutes'
                ) THEN
                    INSERT INTO public.market_stock_notifications (
                        id, seller_id, product_id, notification_type, message, created_at
                    ) VALUES (
                        uuid_generate_v4(), v_item.seller_id, v_item.product_id, 'out_of_stock',
                        v_npc.name || ' visitou sua barraca à procura de ' || v_item.product_name || ', mas o item estava esgotado! (-' || v_reputation_penalty || ' reputação)',
                        NOW()
                    );
                END IF;

                INSERT INTO public.market_npc_visits (
                    id, npc_id, seller_id, stall_id, product_id, action_result,
                    quantity, unit_price, total_cost, reputation_impact, created_at
                ) VALUES (
                    uuid_generate_v4(), v_npc.id, v_item.seller_id, v_item.stall_id, v_item.product_id,
                    'out_of_stock', p_quantity, v_item.unit_price, 0, -v_reputation_penalty, NOW()
                );
            END IF;

            RETURN jsonb_build_object(
                'success', false,
                'reason', 'target_stock_depleted',
                'npc_name', v_npc.name,
                'seller_id', v_item.seller_id,
                'product_id', v_item.product_id,
                'reputation_penalty', v_reputation_penalty
            );
        END IF;
    ELSE
        -- Visita autônoma: busca item ativo com estoque, priorizando categoria favorita do NPC
        SELECT * INTO v_item
        FROM public.market_inventory
        WHERE quantity > 0
          AND unit_price <= v_npc.max_unit_price
          AND unit_price <= v_npc.budget_remaining
        ORDER BY
          CASE WHEN category = v_npc.preferred_category THEN 0 ELSE 1 END,
          created_at ASC
        LIMIT 1
        FOR UPDATE;
    END IF;

    -- Se não encontrar nenhum estoque elegível nas barracas visitadas
    IF v_item.id IS NULL OR v_item.quantity <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'no_eligible_stock'
        );
    END IF;

    -- 3. Validação do teto de preço do NPC
    IF v_item.unit_price > v_npc.max_unit_price THEN
        INSERT INTO public.market_npc_visits (
            id, npc_id, seller_id, stall_id, product_id, action_result,
            quantity, unit_price, total_cost, reputation_impact, created_at
        ) VALUES (
            uuid_generate_v4(), v_npc.id, v_item.seller_id, v_item.stall_id, v_item.product_id,
            'price_too_high', p_quantity, v_item.unit_price, 0, 0.00, NOW()
        );

        RETURN jsonb_build_object(
            'success', false,
            'reason', 'price_above_limit',
            'unit_price', v_item.unit_price,
            'max_price', v_npc.max_unit_price
        );
    END IF;

    -- 4. Cálculo da quantidade exata a comprar
    v_qty_to_buy := LEAST(
        GREATEST(1, p_quantity),
        v_item.quantity,
        FLOOR(v_npc.budget_remaining / v_item.unit_price)::INT
    );

    IF v_qty_to_buy <= 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'reason', 'insufficient_budget',
            'budget_remaining', v_npc.budget_remaining,
            'unit_price', v_item.unit_price
        );
    END IF;

    v_total_price := v_qty_to_buy * v_item.unit_price;

    -- 5. Atualização atômica do estoque oficial (market_inventory)
    UPDATE public.market_inventory
    SET quantity = quantity - v_qty_to_buy,
        updated_at = NOW()
    WHERE id = v_item.id;

    -- Sincronização segura da tabela legada market_listings, caso exista com o mesmo ID
    UPDATE public.market_listings
    SET quantity = GREATEST(0, quantity - v_qty_to_buy),
        status = CASE WHEN quantity - v_qty_to_buy <= 0 THEN 'sold' ELSE 'active' END
    WHERE id = v_item.id;

    -- 6. Crédito atômico na carteira do vendedor (market_wallets) sem conceder moedas arbitrárias
    INSERT INTO public.market_wallets (player_id, balance, total_earned, total_spent, updated_at)
    VALUES (v_item.seller_id, v_total_price, v_total_price, 0, NOW())
    ON CONFLICT (player_id) DO UPDATE SET
        balance = market_wallets.balance + v_total_price,
        total_earned = market_wallets.total_earned + v_total_price,
        updated_at = NOW()
    RETURNING balance INTO v_new_balance;

    -- Sincronização da carteira legada do jogador
    UPDATE public.player_wallet
    SET balance = balance + v_total_price,
        total_earned = total_earned + v_total_price,
        updated_at = NOW()
    WHERE player_id = v_item.seller_id;

    -- 7. Dedução do orçamento do NPC
    UPDATE public.market_npc_budget
    SET budget_remaining = budget_remaining - v_total_price,
        updated_at = NOW()
    WHERE npc_id = v_npc.id;

    UPDATE public.market_npc_profiles
    SET budget_remaining = budget_remaining - v_total_price,
        updated_at = NOW()
    WHERE id = v_npc.id;

    -- 8. Registro em market_transactions
    v_tx_id := uuid_generate_v4();
    INSERT INTO public.market_transactions (
        id, listing_id, buyer_id, buyer_name, seller_id, seller_name,
        product_id, quantity, total_cost, created_at
    ) VALUES (
        v_tx_id, v_item.id, v_npc.id, v_npc.name, v_item.seller_id, v_item.seller_name,
        v_item.product_id, v_qty_to_buy, v_total_price, NOW()
    );

    -- 9. Registro no Livro Caixa Financeiro (market_wallet_ledger)
    INSERT INTO public.market_wallet_ledger (
        id, player_id, amount, balance_after, transaction_type, reference_id, description, created_at
    ) VALUES (
        uuid_generate_v4(), v_item.seller_id, v_total_price, v_new_balance,
        'npc_purchase', v_tx_id::text,
        v_npc.name || ' comprou ' || v_qty_to_buy || 'x ' || v_item.product_name || ' por ' || v_total_price || ' moedas',
        NOW()
    );

    -- 10. Atualização de Reputação e Registro da Visita
    INSERT INTO public.market_farm_reputation (
        seller_id, reputation_score, total_sales, total_visits, missed_sales, last_visit_at, updated_at
    ) VALUES (
        v_item.seller_id, 100.00, 1, 1, 0, NOW(), NOW()
    )
    ON CONFLICT (seller_id) DO UPDATE SET
        reputation_score = LEAST(100.00, market_farm_reputation.reputation_score + v_reputation_gain),
        total_sales = market_farm_reputation.total_sales + 1,
        total_visits = market_farm_reputation.total_visits + 1,
        last_visit_at = NOW(),
        updated_at = NOW();

    INSERT INTO public.market_npc_visits (
        id, npc_id, seller_id, stall_id, product_id, action_result,
        quantity, unit_price, total_cost, reputation_impact, created_at
    ) VALUES (
        uuid_generate_v4(), v_npc.id, v_item.seller_id, v_item.stall_id, v_item.product_id,
        'purchased', v_qty_to_buy, v_item.unit_price, v_total_price, v_reputation_gain, NOW()
    );

    -- Notificação se o estoque zerou após a venda
    IF (v_item.quantity - v_qty_to_buy) = 0 THEN
        INSERT INTO public.market_stock_notifications (
            id, seller_id, product_id, notification_type, message, created_at
        ) VALUES (
            uuid_generate_v4(), v_item.seller_id, v_item.product_id, 'out_of_stock',
            'O estoque de ' || v_item.product_name || ' na sua barraca esgotou após a compra de ' || v_npc.name || '! Reponha para evitar penalidades de reputação.',
            NOW()
        );
    END IF;

    -- 11. Resposta atômica e confirmada
    RETURN jsonb_build_object(
        'success', true,
        'transaction_id', v_tx_id,
        'npc_id', v_npc.id,
        'npc_name', v_npc.name,
        'npc_avatar', v_npc.avatar,
        'npc_icon', v_npc.icon,
        'seller_id', v_item.seller_id,
        'seller_name', v_item.seller_name,
        'stall_id', v_item.stall_id,
        'product_id', v_item.product_id,
        'product_name', v_item.product_name,
        'icon', v_item.icon,
        'quantity', v_qty_to_buy,
        'unit_price', v_item.unit_price,
        'total_cost', v_total_price,
        'seller_new_balance', v_new_balance,
        'npc_budget_remaining', v_npc.budget_remaining - v_total_price,
        'remaining_stock', v_item.quantity - v_qty_to_buy,
        'reputation_gain', v_reputation_gain,
        'timestamp', to_char(NOW(), 'YYYY-MM-DD"T"HH24:MI:SS"Z"')
    );
END;
$$;

-- 22.12 Agendamento Oficial no Supabase pg_cron
-- SELECT cron.schedule('fazendinha-isa-npc-purchase', '*/1 * * * *', 'SELECT public.market_process_npc_purchase();');

-- =====================================================================
-- 23. EVOLUÇÃO COMPLETA: 10 CULTURAS, 16 TALHÕES, PREFERÊNCIAS DE COLHEITA
-- =====================================================================

-- 23.1 Inserção completa das 10 Culturas Oficiais da Fazendinha da Isa
INSERT INTO public.crops (id, name, seed_cost, sell_value, growth_time_seconds, xp_reward, water_multiplier)
VALUES
    ('corn', 'Milho Dourado', 10, 25, 22, 20, 0.7),
    ('soy', 'Soja da Roça', 14, 30, 26, 25, 0.7),
    ('bean', 'Feijão Carioca', 12, 28, 24, 22, 0.7),
    ('wheat', 'Trigo Dourado', 16, 32, 28, 26, 0.7),
    ('rice', 'Arroz Cristalino', 15, 30, 26, 24, 0.7),
    ('tomato', 'Tomate Vermelhinho', 12, 26, 25, 22, 0.7),
    ('carrot', 'Cenoura Crocante', 8, 20, 18, 16, 0.7),
    ('strawberry', 'Morango Doce', 22, 45, 32, 35, 0.7),
    ('pumpkin', 'Abóbora Gigante', 25, 55, 36, 40, 0.7),
    ('lettuce', 'Alface Fresquinha', 10, 18, 16, 14, 0.7)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    seed_cost = EXCLUDED.seed_cost,
    sell_value = EXCLUDED.sell_value,
    growth_time_seconds = EXCLUDED.growth_time_seconds,
    xp_reward = EXCLUDED.xp_reward,
    water_multiplier = EXCLUDED.water_multiplier;

-- Sincronizar catálogo de produtos do mercado (market_products)
INSERT INTO public.market_products (id, name, category, icon, base_price, min_price, max_price, seed_cost, growth_seconds)
VALUES
    ('corn', 'Milho Dourado', 'crop', '🌽', 25, 15, 45, 10, 22),
    ('soy', 'Soja da Roça', 'crop', '🌱', 30, 18, 55, 14, 26),
    ('bean', 'Feijão Carioca', 'crop', '🫘', 28, 16, 50, 12, 24),
    ('wheat', 'Trigo Dourado', 'grains', '🌾', 32, 18, 55, 16, 28),
    ('rice', 'Arroz Cristalino', 'grains', '🍚', 30, 18, 50, 15, 26),
    ('tomato', 'Tomate Vermelhinho', 'crop', '🍅', 26, 15, 48, 12, 25),
    ('carrot', 'Cenoura Crocante', 'crop', '🥕', 20, 12, 38, 8, 18),
    ('strawberry', 'Morango Doce', 'fruits', '🍓', 45, 25, 75, 22, 32),
    ('pumpkin', 'Abóbora Gigante', 'crop', '🎃', 55, 30, 95, 25, 36),
    ('lettuce', 'Alface Fresquinha', 'crop', '🥬', 18, 10, 32, 10, 16)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    base_price = EXCLUDED.base_price,
    seed_cost = EXCLUDED.seed_cost,
    growth_seconds = EXCLUDED.growth_seconds;

-- 23.2 Semear e Expandir os 16 Talhões da Horta Central (IDs 0 a 15)
INSERT INTO public.farm_plots (id, crop_type, stage, is_watered, planted_at, growth_duration_seconds)
VALUES
    (0, 'corn', 3, true, NOW() - INTERVAL '35 seconds', 22),
    (1, 'corn', 3, true, NOW() - INTERVAL '35 seconds', 22),
    (2, 'carrot', 2, true, NOW() - INTERVAL '12 seconds', 18),
    (3, 'tomato', 3, true, NOW() - INTERVAL '40 seconds', 25),
    (4, 'bean', 2, false, NOW() - INTERVAL '8 seconds', 24),
    (5, 'strawberry', 1, true, NOW() - INTERVAL '5 seconds', 32),
    (6, 'lettuce', 2, true, NOW() - INTERVAL '10 seconds', 16),
    (7, 'wheat', 1, false, NOW() - INTERVAL '6 seconds', 28),
    (8, null, 0, false, null, 25),
    (9, null, 0, false, null, 25),
    (10, null, 0, false, null, 25),
    (11, null, 0, false, null, 25),
    (12, null, 0, false, null, 25),
    (13, null, 0, false, null, 25),
    (14, null, 0, false, null, 25),
    (15, null, 0, false, null, 25)
ON CONFLICT (id) DO NOTHING;

-- 23.3 Tabela de Preferências de Colheita do Jogador (market_player_harvest_preferences)
CREATE TABLE IF NOT EXISTS public.market_player_harvest_preferences (
    player_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    mode VARCHAR(4) NOT NULL DEFAULT 'C' CHECK (mode IN ('A', 'B', 'C')),
    market_percent INT NOT NULL DEFAULT 70 CHECK (market_percent >= 0 AND market_percent <= 100),
    inventory_percent INT NOT NULL DEFAULT 30 CHECK (inventory_percent >= 0 AND inventory_percent <= 100),
    auto_apply BOOLEAN NOT NULL DEFAULT false,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.market_player_harvest_preferences ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Leitura de preferência de colheita" ON public.market_player_harvest_preferences;
CREATE POLICY "Leitura de preferência de colheita" ON public.market_player_harvest_preferences FOR SELECT USING (auth.uid() = player_id);
DROP POLICY IF EXISTS "Inserção de preferência de colheita" ON public.market_player_harvest_preferences;
CREATE POLICY "Inserção de preferência de colheita" ON public.market_player_harvest_preferences FOR INSERT WITH CHECK (auth.uid() = player_id);
DROP POLICY IF EXISTS "Atualização de preferência de colheita" ON public.market_player_harvest_preferences;
CREATE POLICY "Atualização de preferência de colheita" ON public.market_player_harvest_preferences FOR UPDATE USING (auth.uid() = player_id);

-- 23.4 Atualização Completa da Stored Procedure market_farm_action
CREATE OR REPLACE FUNCTION public.market_farm_action(
    p_plot_id INT,
    p_action TEXT,
    p_crop_type TEXT DEFAULT NULL,
    p_harvest_mode TEXT DEFAULT 'C',
    p_market_pct INT DEFAULT 70
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID;
    v_seed_id TEXT;
    v_seed_count INT;
    v_crop_duration INT := 25;
    v_plot RECORD;
    v_elapsed_sec NUMERIC;
    v_effective_duration NUMERIC;
    v_is_ripe BOOLEAN;
    v_harvest_qty INT := 2;
    v_market_qty INT := 0;
    v_backpack_qty INT := 0;
    v_crop_name TEXT;
    v_crop_icon TEXT;
    v_base_price INT := 25;
    v_stall_id TEXT;
    v_player_name TEXT := 'Fazendeiro';
BEGIN
    v_uid := auth.uid();
    IF v_uid IS NULL THEN
        RAISE EXCEPTION 'Autenticação necessária';
    END IF;

    IF p_plot_id < 0 OR p_plot_id > 63 THEN
        RAISE EXCEPTION 'ID de talhão inválido: %', p_plot_id;
    END IF;

    SELECT * INTO v_plot FROM public.farm_plots WHERE id = p_plot_id;
    IF v_plot.id IS NULL THEN
        INSERT INTO public.farm_plots (id, crop_type, stage, is_watered, planted_at, growth_duration_seconds)
        VALUES (p_plot_id, null, 0, false, null, 25)
        RETURNING * INTO v_plot;
    END IF;

    IF p_action = 'plant' THEN
        IF p_crop_type IS NULL THEN
            RAISE EXCEPTION 'Tipo de cultivo não informado';
        END IF;

        IF v_plot.crop_type IS NOT NULL THEN
            RAISE EXCEPTION 'O talhão #% já possui uma plantação ativa!', p_plot_id;
        END IF;

        SELECT growth_time_seconds INTO v_crop_duration FROM public.crops WHERE id = p_crop_type;
        IF v_crop_duration IS NULL THEN v_crop_duration := 25; END IF;

        v_seed_id := p_crop_type || '_seed';
        SELECT quantity INTO v_seed_count FROM public.player_inventory
        WHERE player_id = v_uid AND item_id = v_seed_id;

        IF v_seed_count IS NULL OR v_seed_count < 1 THEN
            RAISE EXCEPTION 'Você não tem sementes de % suficientes', p_crop_type;
        END IF;

        -- Consumir exatamente 1 semente
        UPDATE public.player_inventory
        SET quantity = quantity - 1,
            updated_at = NOW()
        WHERE player_id = v_uid AND item_id = v_seed_id;

        -- Registrar plantio persistente com timestamp exato
        UPDATE public.farm_plots
        SET crop_type = p_crop_type,
            stage = 1,
            is_watered = false,
            planted_by = v_uid,
            planted_at = NOW(),
            growth_duration_seconds = v_crop_duration,
            updated_at = NOW()
        WHERE id = p_plot_id;

    ELSIF p_action = 'water' THEN
        IF v_plot.crop_type IS NULL THEN
            RAISE EXCEPTION 'Não há plantação para regar no talhão #%', p_plot_id;
        END IF;

        UPDATE public.farm_plots
        SET is_watered = true,
            updated_at = NOW()
        WHERE id = p_plot_id;

    ELSIF p_action = 'harvest' THEN
        IF v_plot.crop_type IS NULL THEN
            RAISE EXCEPTION 'O talhão #% já está vazio ou foi colhido!', p_plot_id;
        END IF;

        -- Validação rigorosa de maturação: não permite colher antes do tempo real transcorrido
        v_crop_duration := COALESCE(v_plot.growth_duration_seconds, 25);
        IF v_plot.planted_at IS NOT NULL THEN
            v_elapsed_sec := EXTRACT(EPOCH FROM (NOW() - v_plot.planted_at));
            -- Se foi regado, velocidade 100%; se não foi regado, velocidade 50%
            IF v_plot.is_watered THEN
                v_effective_duration := v_elapsed_sec;
            ELSE
                v_effective_duration := v_elapsed_sec * 0.5;
            END IF;
            v_is_ripe := (v_effective_duration >= v_crop_duration) OR (v_plot.stage >= 5);
        ELSE
            v_is_ripe := (v_plot.stage >= 5);
        END IF;

        IF NOT v_is_ripe THEN
            RAISE EXCEPTION 'Esta plantação de % ainda está crescendo e não pode ser colhida antes de madura!', v_plot.crop_type;
        END IF;

        -- Obter metadados do produto para distribuição
        SELECT name, base_price, icon INTO v_crop_name, v_base_price, v_crop_icon
        FROM public.market_products WHERE id = v_plot.crop_type;
        IF v_crop_name IS NULL THEN v_crop_name := v_plot.crop_type; END IF;
        IF v_base_price IS NULL THEN v_base_price := 25; END IF;
        IF v_crop_icon IS NULL THEN v_crop_icon := '🌾'; END IF;

        SELECT nickname INTO v_player_name FROM public.market_players WHERE id = v_uid;
        IF v_player_name IS NULL THEN v_player_name := 'Fazendeiro'; END IF;

        -- Cálculo atômico da distribuição (A, B ou C)
        IF p_harvest_mode = 'A' THEN
            v_market_qty := v_harvest_qty;
            v_backpack_qty := 0;
        ELSIF p_harvest_mode = 'B' THEN
            v_market_qty := 0;
            v_backpack_qty := v_harvest_qty;
        ELSE -- Opção C: Distribuição personalizada
            v_market_qty := ROUND(v_harvest_qty * (p_market_pct / 100.0));
            v_backpack_qty := v_harvest_qty - v_market_qty;
        END IF;

        -- 1. Destinar para a mochila pessoal do jogador se houver cota
        IF v_backpack_qty > 0 THEN
            INSERT INTO public.player_inventory (player_id, item_id, category, quantity, updated_at)
            VALUES (v_uid, v_plot.crop_type, 'crop', v_backpack_qty, NOW())
            ON CONFLICT (player_id, item_id) DO UPDATE SET
                quantity = player_inventory.quantity + v_backpack_qty,
                updated_at = NOW();
        END IF;

        -- 2. Destinar para o estoque real da barraca do mercado se houver cota
        IF v_market_qty > 0 THEN
            -- Garantir que o jogador possui barraca cadastrada
            v_stall_id := 'stall-' || SUBSTRING(v_uid::TEXT, 1, 8);
            INSERT INTO public.market_stalls (id, player_id, stall_name)
            VALUES (v_stall_id, v_uid, 'Barraca de ' || v_player_name)
            ON CONFLICT (player_id) DO NOTHING;

            -- Inserir / Atualizar anúncio ativo na barraca do jogador
            INSERT INTO public.market_listings (
                id, stall_id, seller_id, seller_name, stall_name,
                product_id, product_name, icon, category, quantity,
                price_per_unit, status, created_at, updated_at
            ) VALUES (
                'list-' || v_uid::TEXT || '-' || v_plot.crop_type,
                v_stall_id, v_uid, v_player_name, 'Barraca de ' || v_player_name,
                v_plot.crop_type, v_crop_name, v_crop_icon, 'crop', v_market_qty,
                v_base_price, 'active', NOW(), NOW()
            )
            ON CONFLICT (id) DO UPDATE SET
                quantity = market_listings.quantity + v_market_qty,
                price_per_unit = COALESCE(market_listings.price_per_unit, v_base_price),
                status = 'active',
                updated_at = NOW();
        END IF;

        -- 3. Reset atômico do talhão colhido
        UPDATE public.farm_plots
        SET crop_type = NULL,
            stage = 0,
            is_watered = false,
            planted_by = NULL,
            planted_at = NULL,
            updated_at = NOW()
        WHERE id = p_plot_id;
    END IF;

    RETURN public.market_state();
END;
$$;





