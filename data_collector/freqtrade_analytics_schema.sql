--
-- PostgreSQL database dump
--

\restrict 60Yd8dYWj1IYUW43ubuVlRFJ67fg6fbzK7FlyPNhGVIB0bKPEo55Bh3Yc3G7lBR

-- Dumped from database version 15.15 (Debian 15.15-0+deb12u1)
-- Dumped by pg_dump version 15.15 (Debian 15.15-0+deb12u1)

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'SQL_ASCII';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: bot_snapshots; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.bot_snapshots (
    id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now(),
    bot_name character varying(50) NOT NULL,
    status character varying(20),
    mode character varying(20),
    profit_all numeric(18,8),
    profit_closed numeric(18,8),
    winrate numeric(5,2),
    trade_count integer,
    open_trades integer,
    balance numeric(18,8),
    max_drawdown numeric(8,4),
    current_drawdown numeric(8,4)
);


--
-- Name: bot_snapshots_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.bot_snapshots_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: bot_snapshots_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.bot_snapshots_id_seq OWNED BY public.bot_snapshots.id;


--
-- Name: daily_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.daily_performance (
    date date NOT NULL,
    bot_name character varying(50) NOT NULL,
    strategy character varying(50),
    profit numeric(18,8) DEFAULT 0,
    win_count integer DEFAULT 0,
    loss_count integer DEFAULT 0,
    total_trades integer DEFAULT 0,
    max_drawdown numeric(8,4) DEFAULT 0,
    balance numeric(18,8),
    starting_capital numeric(18,8)
);


--
-- Name: pair_performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pair_performance (
    pair character varying(20) NOT NULL,
    strategy character varying(50) NOT NULL,
    bot_name character varying(50) NOT NULL,
    total_trades integer DEFAULT 0,
    win_rate numeric(5,2) DEFAULT 0,
    avg_profit numeric(18,8) DEFAULT 0,
    total_profit numeric(18,8) DEFAULT 0,
    profit_factor numeric(8,4) DEFAULT 0,
    first_trade_date date,
    last_trade_date date,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: pipeline_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.pipeline_logs (
    id integer NOT NULL,
    "timestamp" timestamp without time zone DEFAULT now(),
    level character varying(10),
    message text,
    bot_name character varying(50)
);


--
-- Name: pipeline_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.pipeline_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: pipeline_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.pipeline_logs_id_seq OWNED BY public.pipeline_logs.id;


--
-- Name: trades; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.trades (
    id integer NOT NULL,
    bot_name character varying(50) NOT NULL,
    strategy character varying(50),
    pair character varying(20) NOT NULL,
    trade_id integer,
    side character varying(10),
    amount numeric(18,8),
    open_rate numeric(18,8),
    close_rate numeric(18,8),
    profit_abs numeric(18,8),
    profit_pct numeric(8,4),
    open_date timestamp without time zone NOT NULL,
    close_date timestamp without time zone,
    trade_duration_minutes integer,
    is_short boolean DEFAULT false,
    exchange character varying(20),
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: trades_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.trades_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: trades_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.trades_id_seq OWNED BY public.trades.id;


--
-- Name: bot_snapshots id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_snapshots ALTER COLUMN id SET DEFAULT nextval('public.bot_snapshots_id_seq'::regclass);


--
-- Name: pipeline_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_logs ALTER COLUMN id SET DEFAULT nextval('public.pipeline_logs_id_seq'::regclass);


--
-- Name: trades id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades ALTER COLUMN id SET DEFAULT nextval('public.trades_id_seq'::regclass);


--
-- Name: bot_snapshots bot_snapshots_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.bot_snapshots
    ADD CONSTRAINT bot_snapshots_pkey PRIMARY KEY (id);


--
-- Name: daily_performance daily_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.daily_performance
    ADD CONSTRAINT daily_performance_pkey PRIMARY KEY (date, bot_name);


--
-- Name: pair_performance pair_performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pair_performance
    ADD CONSTRAINT pair_performance_pkey PRIMARY KEY (pair, strategy, bot_name);


--
-- Name: pipeline_logs pipeline_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.pipeline_logs
    ADD CONSTRAINT pipeline_logs_pkey PRIMARY KEY (id);


--
-- Name: trades trades_bot_name_trade_id_open_date_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_bot_name_trade_id_open_date_key UNIQUE (bot_name, trade_id, open_date);


--
-- Name: trades trades_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.trades
    ADD CONSTRAINT trades_pkey PRIMARY KEY (id);


--
-- Name: idx_daily_bot_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_bot_name ON public.daily_performance USING btree (bot_name);


--
-- Name: idx_daily_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_daily_date ON public.daily_performance USING btree (date);


--
-- Name: idx_pair_performance_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pair_performance_pair ON public.pair_performance USING btree (pair);


--
-- Name: idx_pair_performance_strategy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pair_performance_strategy ON public.pair_performance USING btree (strategy);


--
-- Name: idx_pipeline_logs_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_pipeline_logs_timestamp ON public.pipeline_logs USING btree ("timestamp");


--
-- Name: idx_snapshots_bot_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_snapshots_bot_name ON public.bot_snapshots USING btree (bot_name);


--
-- Name: idx_snapshots_timestamp; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_snapshots_timestamp ON public.bot_snapshots USING btree ("timestamp");


--
-- Name: idx_trades_bot_name; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_bot_name ON public.trades USING btree (bot_name);


--
-- Name: idx_trades_close_date; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_close_date ON public.trades USING btree (close_date);


--
-- Name: idx_trades_pair; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_pair ON public.trades USING btree (pair);


--
-- Name: idx_trades_strategy; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_trades_strategy ON public.trades USING btree (strategy);


--
-- PostgreSQL database dump complete
--

\unrestrict 60Yd8dYWj1IYUW43ubuVlRFJ67fg6fbzK7FlyPNhGVIB0bKPEo55Bh3Yc3G7lBR

