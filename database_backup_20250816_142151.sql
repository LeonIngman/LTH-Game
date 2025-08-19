--
-- PostgreSQL database dump
--

-- Dumped from database version 17.5 (Postgres.app)
-- Dumped by pg_dump version 17.5 (Homebrew)

-- Started on 2025-08-16 14:21:51 CEST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

ALTER TABLE IF EXISTS ONLY public."TimeStamp" DROP CONSTRAINT IF EXISTS "TimeStamp_levelId_fkey";
ALTER TABLE IF EXISTS ONLY public."SupplierProduct" DROP CONSTRAINT IF EXISTS "SupplierProduct_supplier_id_fkey";
ALTER TABLE IF EXISTS ONLY public."SupplierProduct" DROP CONSTRAINT IF EXISTS "SupplierProduct_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_user_id_fkey";
ALTER TABLE IF EXISTS ONLY public."QuizSubmission" DROP CONSTRAINT IF EXISTS "QuizSubmission_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Performance" DROP CONSTRAINT IF EXISTS "Performance_userId_fkey";
ALTER TABLE IF EXISTS ONLY public."Performance" DROP CONSTRAINT IF EXISTS "Performance_timestampId_fkey";
ALTER TABLE IF EXISTS ONLY public."Performance" DROP CONSTRAINT IF EXISTS "Performance_levelId_fkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_product_id_fkey";
ALTER TABLE IF EXISTS ONLY public."GameDailyData" DROP CONSTRAINT IF EXISTS "GameDailyData_performanceId_fkey";
DROP INDEX IF EXISTS public.idx_timestamp_level;
DROP INDEX IF EXISTS public.idx_quiz_submission_user_level;
DROP INDEX IF EXISTS public.idx_quiz_submission_level;
DROP INDEX IF EXISTS public.idx_performance_user;
DROP INDEX IF EXISTS public.idx_performance_level;
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_username_key";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_pkey";
ALTER TABLE IF EXISTS ONLY public."User" DROP CONSTRAINT IF EXISTS "User_email_key";
ALTER TABLE IF EXISTS ONLY public."TimeStamp" DROP CONSTRAINT IF EXISTS "TimeStamp_pkey";
ALTER TABLE IF EXISTS ONLY public."Supplier" DROP CONSTRAINT IF EXISTS "Supplier_pkey";
ALTER TABLE IF EXISTS ONLY public."SupplierProduct" DROP CONSTRAINT IF EXISTS "SupplierProduct_pkey";
ALTER TABLE IF EXISTS ONLY public."Session" DROP CONSTRAINT IF EXISTS "Session_pkey";
ALTER TABLE IF EXISTS ONLY public."QuizSubmission" DROP CONSTRAINT IF EXISTS "QuizSubmission_userId_levelId_key";
ALTER TABLE IF EXISTS ONLY public."QuizSubmission" DROP CONSTRAINT IF EXISTS "QuizSubmission_pkey";
ALTER TABLE IF EXISTS ONLY public."Product" DROP CONSTRAINT IF EXISTS "Product_pkey";
ALTER TABLE IF EXISTS ONLY public."Performance" DROP CONSTRAINT IF EXISTS "Performance_pkey";
ALTER TABLE IF EXISTS ONLY public."Order" DROP CONSTRAINT IF EXISTS "Order_pkey";
ALTER TABLE IF EXISTS ONLY public."GameSession" DROP CONSTRAINT IF EXISTS "GameSession_user_level_unique";
ALTER TABLE IF EXISTS ONLY public."GameSession" DROP CONSTRAINT IF EXISTS "GameSession_pkey";
ALTER TABLE IF EXISTS ONLY public."GameLevel" DROP CONSTRAINT IF EXISTS "GameLevel_pkey";
ALTER TABLE IF EXISTS ONLY public."GameDailyData" DROP CONSTRAINT IF EXISTS "GameDailyData_pkey";
ALTER TABLE IF EXISTS public."TimeStamp" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Supplier" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."QuizSubmission" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Product" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Performance" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."Order" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."GameSession" ALTER COLUMN id DROP DEFAULT;
ALTER TABLE IF EXISTS public."GameDailyData" ALTER COLUMN id DROP DEFAULT;
DROP TABLE IF EXISTS public."User";
DROP SEQUENCE IF EXISTS public."TimeStamp_id_seq";
DROP TABLE IF EXISTS public."TimeStamp";
DROP SEQUENCE IF EXISTS public."Supplier_id_seq";
DROP TABLE IF EXISTS public."SupplierProduct";
DROP TABLE IF EXISTS public."Supplier";
DROP TABLE IF EXISTS public."Session";
DROP SEQUENCE IF EXISTS public."QuizSubmission_id_seq";
DROP TABLE IF EXISTS public."QuizSubmission";
DROP SEQUENCE IF EXISTS public."Product_id_seq";
DROP TABLE IF EXISTS public."Product";
DROP SEQUENCE IF EXISTS public."Performance_id_seq";
DROP TABLE IF EXISTS public."Performance";
DROP SEQUENCE IF EXISTS public."Order_id_seq";
DROP TABLE IF EXISTS public."Order";
DROP SEQUENCE IF EXISTS public."GameSession_id_seq";
DROP TABLE IF EXISTS public."GameSession";
DROP TABLE IF EXISTS public."GameLevel";
DROP SEQUENCE IF EXISTS public."GameDailyData_id_seq";
DROP TABLE IF EXISTS public."GameDailyData";
SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 225 (class 1259 OID 17578)
-- Name: GameDailyData; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GameDailyData" (
    id integer NOT NULL,
    "performanceId" integer,
    day integer NOT NULL,
    cash numeric NOT NULL,
    "pattyInventory" integer NOT NULL,
    "bunInventory" integer NOT NULL,
    "cheeseInventory" integer NOT NULL,
    "potatoInventory" integer NOT NULL,
    "finishedGoodsInventory" integer NOT NULL,
    production integer NOT NULL,
    sales integer NOT NULL,
    revenue numeric NOT NULL,
    "purchaseCosts" numeric NOT NULL,
    "productionCosts" numeric NOT NULL,
    "holdingCosts" numeric NOT NULL,
    "totalCosts" numeric NOT NULL,
    profit numeric NOT NULL,
    "cumulativeProfit" numeric NOT NULL
);


--
-- TOC entry 224 (class 1259 OID 17577)
-- Name: GameDailyData_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GameDailyData_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3805 (class 0 OID 0)
-- Dependencies: 224
-- Name: GameDailyData_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GameDailyData_id_seq" OWNED BY public."GameDailyData".id;


--
-- TOC entry 217 (class 1259 OID 17503)
-- Name: GameLevel; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GameLevel" (
    id integer NOT NULL,
    name text NOT NULL,
    description text NOT NULL,
    "maxScore" integer NOT NULL
);


--
-- TOC entry 234 (class 1259 OID 17645)
-- Name: GameSession; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."GameSession" (
    id integer NOT NULL,
    user_id text NOT NULL,
    level_id integer NOT NULL,
    game_state jsonb NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 233 (class 1259 OID 17644)
-- Name: GameSession_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."GameSession_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3806 (class 0 OID 0)
-- Dependencies: 233
-- Name: GameSession_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."GameSession_id_seq" OWNED BY public."GameSession".id;


--
-- TOC entry 232 (class 1259 OID 17630)
-- Name: Order; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Order" (
    id integer NOT NULL,
    user_id text NOT NULL,
    product_id integer,
    quantity integer NOT NULL,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 231 (class 1259 OID 17629)
-- Name: Order_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Order_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3807 (class 0 OID 0)
-- Dependencies: 231
-- Name: Order_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Order_id_seq" OWNED BY public."Order".id;


--
-- TOC entry 223 (class 1259 OID 17553)
-- Name: Performance; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Performance" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "levelId" integer NOT NULL,
    "timestampId" integer,
    score integer NOT NULL,
    "cumulativeProfit" numeric NOT NULL,
    "cashFlow" numeric NOT NULL,
    "rawMaterialAStock" integer NOT NULL,
    "rawMaterialBStock" integer NOT NULL,
    "finishedGoodStock" integer NOT NULL,
    decisions jsonb,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "hasDetailedData" boolean DEFAULT false NOT NULL
);


--
-- TOC entry 222 (class 1259 OID 17552)
-- Name: Performance_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Performance_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3808 (class 0 OID 0)
-- Dependencies: 222
-- Name: Performance_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Performance_id_seq" OWNED BY public."Performance".id;


--
-- TOC entry 229 (class 1259 OID 17604)
-- Name: Product; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Product" (
    id integer NOT NULL,
    name text NOT NULL
);


--
-- TOC entry 228 (class 1259 OID 17603)
-- Name: Product_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Product_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3809 (class 0 OID 0)
-- Dependencies: 228
-- Name: Product_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Product_id_seq" OWNED BY public."Product".id;


--
-- TOC entry 236 (class 1259 OID 17656)
-- Name: QuizSubmission; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."QuizSubmission" (
    id integer NOT NULL,
    "userId" text NOT NULL,
    "levelId" integer NOT NULL,
    answers jsonb NOT NULL,
    "submittedAt" timestamp with time zone DEFAULT now()
);


--
-- TOC entry 235 (class 1259 OID 17655)
-- Name: QuizSubmission_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."QuizSubmission_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3810 (class 0 OID 0)
-- Dependencies: 235
-- Name: QuizSubmission_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."QuizSubmission_id_seq" OWNED BY public."QuizSubmission".id;


--
-- TOC entry 221 (class 1259 OID 17539)
-- Name: Session; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Session" (
    id text NOT NULL,
    user_id text,
    created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    expires_at timestamp without time zone NOT NULL
);


--
-- TOC entry 227 (class 1259 OID 17595)
-- Name: Supplier; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."Supplier" (
    id integer NOT NULL,
    name text NOT NULL,
    base_price numeric NOT NULL
);


--
-- TOC entry 230 (class 1259 OID 17612)
-- Name: SupplierProduct; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."SupplierProduct" (
    supplier_id integer NOT NULL,
    product_id integer NOT NULL,
    lead_time integer NOT NULL,
    price_per_item numeric NOT NULL,
    order_capacity integer NOT NULL,
    shipment_price_50 numeric NOT NULL
);


--
-- TOC entry 226 (class 1259 OID 17594)
-- Name: Supplier_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."Supplier_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3811 (class 0 OID 0)
-- Dependencies: 226
-- Name: Supplier_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."Supplier_id_seq" OWNED BY public."Supplier".id;


--
-- TOC entry 219 (class 1259 OID 17511)
-- Name: TimeStamp; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."TimeStamp" (
    id integer NOT NULL,
    "levelId" integer NOT NULL,
    "timestampNumber" integer NOT NULL,
    "marketDemand" integer NOT NULL,
    "rawMaterialAPrice" numeric NOT NULL,
    "rawMaterialBPrice" numeric NOT NULL,
    "finishedGoodPrice" numeric NOT NULL
);


--
-- TOC entry 218 (class 1259 OID 17510)
-- Name: TimeStamp_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public."TimeStamp_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- TOC entry 3812 (class 0 OID 0)
-- Dependencies: 218
-- Name: TimeStamp_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public."TimeStamp_id_seq" OWNED BY public."TimeStamp".id;


--
-- TOC entry 220 (class 1259 OID 17524)
-- Name: User; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public."User" (
    id text NOT NULL,
    email text,
    username text NOT NULL,
    password text NOT NULL,
    visible_password text,
    role text NOT NULL,
    progress integer DEFAULT 0,
    "lastActive" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "createdAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
);


--
-- TOC entry 3578 (class 2604 OID 17581)
-- Name: GameDailyData id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameDailyData" ALTER COLUMN id SET DEFAULT nextval('public."GameDailyData_id_seq"'::regclass);


--
-- TOC entry 3583 (class 2604 OID 17648)
-- Name: GameSession id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameSession" ALTER COLUMN id SET DEFAULT nextval('public."GameSession_id_seq"'::regclass);


--
-- TOC entry 3581 (class 2604 OID 17633)
-- Name: Order id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order" ALTER COLUMN id SET DEFAULT nextval('public."Order_id_seq"'::regclass);


--
-- TOC entry 3575 (class 2604 OID 17556)
-- Name: Performance id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Performance" ALTER COLUMN id SET DEFAULT nextval('public."Performance_id_seq"'::regclass);


--
-- TOC entry 3580 (class 2604 OID 17607)
-- Name: Product id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product" ALTER COLUMN id SET DEFAULT nextval('public."Product_id_seq"'::regclass);


--
-- TOC entry 3586 (class 2604 OID 17659)
-- Name: QuizSubmission id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizSubmission" ALTER COLUMN id SET DEFAULT nextval('public."QuizSubmission_id_seq"'::regclass);


--
-- TOC entry 3579 (class 2604 OID 17598)
-- Name: Supplier id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier" ALTER COLUMN id SET DEFAULT nextval('public."Supplier_id_seq"'::regclass);


--
-- TOC entry 3569 (class 2604 OID 17514)
-- Name: TimeStamp id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimeStamp" ALTER COLUMN id SET DEFAULT nextval('public."TimeStamp_id_seq"'::regclass);


--
-- TOC entry 3788 (class 0 OID 17578)
-- Dependencies: 225
-- Data for Name: GameDailyData; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GameDailyData" (id, "performanceId", day, cash, "pattyInventory", "bunInventory", "cheeseInventory", "potatoInventory", "finishedGoodsInventory", production, sales, revenue, "purchaseCosts", "productionCosts", "holdingCosts", "totalCosts", profit, "cumulativeProfit") FROM stdin;
\.


--
-- TOC entry 3780 (class 0 OID 17503)
-- Dependencies: 217
-- Data for Name: GameLevel; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GameLevel" (id, name, description, "maxScore") FROM stdin;
0	Level 0 - Tutorial	Basic supply chain management tutorial	10000
1	Level 1 - Easy	Introduction to supply chain challenges	15000
2	Level 2 - Medium	Advanced supply chain scenarios	20000
\.


--
-- TOC entry 3797 (class 0 OID 17645)
-- Dependencies: 234
-- Data for Name: GameSession; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."GameSession" (id, user_id, level_id, game_state, created_at, updated_at) FROM stdin;
35	user_t5u1hiin	1	{"day": 1, "cumulativeProfit": 0}	2025-08-16 13:48:56.16463	2025-08-16 14:02:25.141045
33	user_t5u1hiin	0	{"day": 2, "cash": 2500, "score": 0, "history": [{"day": 1, "cash": 2500, "costs": {"total": 0, "holding": 0, "purchases": 0, "transport": 0, "production": 0}, "sales": 0, "score": 0, "profit": 0, "revenue": 0, "inventory": {"bun": 150, "patty": 100, "cheese": 250, "potato": 300, "finishedGoods": 0}, "production": 0, "bunPurchased": 0, "holdingCosts": {"bun": 0, "patty": 0, "cheese": 0, "potato": 0, "finishedGoods": 0}, "inventoryValue": {"bun": 0, "patty": 0, "cheese": 0, "potato": 0, "finishedGoods": 0}, "overstockCosts": {"bun": 0, "patty": 0, "cheese": 0, "potato": 0, "finishedGoods": 0}, "pattyPurchased": 0, "cheesePurchased": 0, "potatoPurchased": 0, "cumulativeProfit": 0, "customerDeliveries": {"1": {"revenue": 0, "quantity": 0}, "2": {"revenue": 0, "quantity": 0}, "3": {"revenue": 0, "quantity": 0}}}], "gameOver": false, "inventory": {"bun": 150, "patty": 100, "cheese": 250, "potato": 300, "finishedGoods": 0}, "forecastData": null, "inventoryValue": {"bun": 0, "patty": 0, "cheese": 0, "potato": 0, "finishedGoods": 0}, "cumulativeProfit": 0, "latenessPenalties": [], "customerDeliveries": {}, "supplierDeliveries": {}, "pendingCustomerOrders": [], "pendingSupplierOrders": []}	2025-08-16 13:37:28.622986	2025-08-16 14:05:52.060177
\.


--
-- TOC entry 3795 (class 0 OID 17630)
-- Dependencies: 232
-- Data for Name: Order; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Order" (id, user_id, product_id, quantity, created_at) FROM stdin;
\.


--
-- TOC entry 3786 (class 0 OID 17553)
-- Dependencies: 223
-- Data for Name: Performance; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Performance" (id, "userId", "levelId", "timestampId", score, "cumulativeProfit", "cashFlow", "rawMaterialAStock", "rawMaterialBStock", "finishedGoodStock", decisions, "createdAt", "hasDetailedData") FROM stdin;
2	user_t5u1hiin	0	2	800	-5147	-5147	5	3	2	[]	2025-08-15 18:31:58.771553	f
3	user_eurl6rx6	0	3	1200	20000	20000	10	5	8	[]	2025-08-15 18:31:58.771553	f
\.


--
-- TOC entry 3792 (class 0 OID 17604)
-- Dependencies: 229
-- Data for Name: Product; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Product" (id, name) FROM stdin;
\.


--
-- TOC entry 3799 (class 0 OID 17656)
-- Dependencies: 236
-- Data for Name: QuizSubmission; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."QuizSubmission" (id, "userId", "levelId", answers, "submittedAt") FROM stdin;
3	user_t5u1hiin	0	{"q1": [], "q2": {"Input": [], "Output": [], "Process": []}, "q3": {}, "q4": "", "q5": {"Make-to-order": {"example": "", "description": ""}, "Make-to-stock": {"example": "", "description": ""}, "Assemble-to-order": {"example": "", "description": ""}, "Engineer-to-order": {"example": "", "description": ""}}, "q6": ""}	2025-08-15 17:29:54.256643+02
\.


--
-- TOC entry 3784 (class 0 OID 17539)
-- Dependencies: 221
-- Data for Name: Session; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Session" (id, user_id, created_at, expires_at) FROM stdin;
e07589a8b924bbe1116c1002f31a4513ceb59763bf647d8f5d801cb3bcf18a2e	user_t5u1hiin	2025-08-13 11:26:03.81697	2025-08-20 11:26:03.816
93bd4c95666e6661a0bbac03d9314030b43ca82d7531095ed5aaa647a872f03b	user_t5u1hiin	2025-08-13 12:07:46.641128	2025-08-20 12:07:46.64
e0b19e256fc647b7f41b804af68fcb30d3874bb2f8778bc966d19f9f4c818a28	user_t5u1hiin	2025-08-13 12:15:11.639344	2025-08-20 12:15:11.638
8f3f7df71bc721dfbd8c53ac9122451235fe838107611a7bd3fa7181feb85dc7	user_t5u1hiin	2025-08-13 12:35:20.882573	2025-08-20 12:35:20.882
ddc3ebd3e7a8f4abc741c5b69d38a32ce6dab89a4c7aa6a260848fc8f9d76326	user_t5u1hiin	2025-08-13 13:00:17.799948	2025-08-20 13:00:17.799
64c7fa98812444fde55d3a8a8f57ab46813a177cbf8663ac1ce38018aa5490a5	user_t5u1hiin	2025-08-13 14:17:27.862599	2025-08-20 14:17:27.862
b5db71a933c13c4878169d4b33bc1307191378858f507ab625fa4284fcb58b2b	user_t5u1hiin	2025-08-13 15:17:02.038115	2025-08-20 15:17:02.037
acf699b30f40e0d97a90a44cc494399fcd6eff536942a562f5af4bd06f792cf4	user_t5u1hiin	2025-08-13 16:33:01.332876	2025-08-20 16:33:01.332
d535d6d6f0d9b0f0b9922c3d66c80b61816aab91f872e355b00fcd19e9a5d735	user_t5u1hiin	2025-08-13 18:02:37.437795	2025-08-20 18:02:37.437
f0d88a9564f0d909ab524655f9e3dde4d84601e72005366f75ede78b14748cb1	user_t5u1hiin	2025-08-14 17:28:54.419329	2025-08-21 17:28:54.418
025905ac0f57a7764fdd228ee061a69b0f56cde628bd5ce6522a3f9deea567f6	user_t5u1hiin	2025-08-14 17:40:10.095254	2025-08-21 17:40:10.094
8d0c46af672bdefa8474911a6f73348adb49b25bd520135ebc37ab580bbcc293	user_t5u1hiin	2025-08-15 13:13:38.159877	2025-08-22 13:13:38.158
c8d275c778b297fef27516d059cd4f200784841f2b17c4290bbc3a12a3f0f81e	user_t5u1hiin	2025-08-15 13:40:13.609721	2025-08-22 13:40:13.609
187b63f586bd0b9c223d722975042b2ae497654cfa044778567eacb2aee695b8	user_t5u1hiin	2025-08-15 17:29:12.964343	2025-08-22 17:29:12.963
84421dd0cd1fc0c4399658095c86f342404b3a9ae6ac259c4b9e3f721d314399	user_t5u1hiin	2025-08-15 17:46:18.745405	2025-08-22 17:46:18.744
ec070da3926b6fa4acf78b62a6e20dd02c9e2aa9c8572fe8a8c522908e08eb52	user_t5u1hiin	2025-08-15 18:33:31.960085	2025-08-22 18:33:31.958
59e0ef63c20b9646941b2664f2ab1d5ae3b9111c624e222716742732a47b62fe	user_t5u1hiin	2025-08-15 19:05:53.264289	2025-08-22 19:05:53.263
eaf26d2d36242aa591d9f9bb6cb638d63ab876760452826b0b302a826fd0d84f	user_t5u1hiin	2025-08-15 19:11:57.664582	2025-08-22 19:11:57.663
d84e3983829d71e3a396da742fbf5f295650d3d3de115db30b695bc3110e9bf3	user_t5u1hiin	2025-08-15 20:52:42.391523	2025-08-22 20:52:42.391
8b8eb20d0efe9f45f000717d41ee7c0b5989d29ffbadef9dfc9bfa7a5fced9b0	user_t5u1hiin	2025-08-15 20:57:45.206812	2025-08-22 20:57:45.206
d8ceb964bb092c4a6a363e8bf159bbba6f92723d2888be4c8d754e99fcda9bab	user_t5u1hiin	2025-08-15 22:44:16.343002	2025-08-22 22:44:16.342
2a4c61eaeea57269e0c5c79f57a878c284d19eec491523685553a1750ef1d740	user_t5u1hiin	2025-08-16 11:59:24.277797	2025-08-23 11:59:24.277
\.


--
-- TOC entry 3790 (class 0 OID 17595)
-- Dependencies: 227
-- Data for Name: Supplier; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."Supplier" (id, name, base_price) FROM stdin;
\.


--
-- TOC entry 3793 (class 0 OID 17612)
-- Dependencies: 230
-- Data for Name: SupplierProduct; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."SupplierProduct" (supplier_id, product_id, lead_time, price_per_item, order_capacity, shipment_price_50) FROM stdin;
\.


--
-- TOC entry 3782 (class 0 OID 17511)
-- Dependencies: 219
-- Data for Name: TimeStamp; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."TimeStamp" (id, "levelId", "timestampNumber", "marketDemand", "rawMaterialAPrice", "rawMaterialBPrice", "finishedGoodPrice") FROM stdin;
2	0	4	100	10.5	8.0	25.0
3	0	13	120	11.0	8.5	26.0
\.


--
-- TOC entry 3783 (class 0 OID 17524)
-- Dependencies: 220
-- Data for Name: User; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public."User" (id, email, username, password, visible_password, role, progress, "lastActive", "createdAt", "updatedAt") FROM stdin;
user_eurl6rx6	\N	leoningman-student	$2b$10$5pX4f.RTCC5/E.IEEV8zKOP0ayMI.pRvCrvjxzeZHWAOFBxvNjQ.G	teVOjw06	student	0	2025-08-13 10:44:44.965682	2025-08-13 10:44:44.965682	2025-08-13 10:44:44.965682
ca53b4ec-27ea-4a2a-bb7e-ab1971423414	leon.ingman@gmail.com	leoningman	$2b$10$baU8PdvABeOgB/6KCQ0JP.7kRAYuE/m5dNNtEueVy0MEd20h3nsaa	password	teacher	3	2025-08-15 13:39:32.743349	2025-08-13 10:41:38.066	2025-08-13 10:41:38.066
user_t5u1hiin	\N	leoningman-student2	$2b$10$NJHsHd/jKhW5c3rYbFlEi.cQzaFWlkU.aVUP2TrwpXX0Xhu7CmsBq	q5Xl04Cs	student	0	2025-08-16 11:59:24.267066	2025-08-13 11:23:07.100302	2025-08-13 11:23:07.100302
\.


--
-- TOC entry 3813 (class 0 OID 0)
-- Dependencies: 224
-- Name: GameDailyData_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GameDailyData_id_seq"', 1, false);


--
-- TOC entry 3814 (class 0 OID 0)
-- Dependencies: 233
-- Name: GameSession_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."GameSession_id_seq"', 40, true);


--
-- TOC entry 3815 (class 0 OID 0)
-- Dependencies: 231
-- Name: Order_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Order_id_seq"', 1, false);


--
-- TOC entry 3816 (class 0 OID 0)
-- Dependencies: 222
-- Name: Performance_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Performance_id_seq"', 3, true);


--
-- TOC entry 3817 (class 0 OID 0)
-- Dependencies: 228
-- Name: Product_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Product_id_seq"', 1, false);


--
-- TOC entry 3818 (class 0 OID 0)
-- Dependencies: 235
-- Name: QuizSubmission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."QuizSubmission_id_seq"', 3, true);


--
-- TOC entry 3819 (class 0 OID 0)
-- Dependencies: 226
-- Name: Supplier_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."Supplier_id_seq"', 1, false);


--
-- TOC entry 3820 (class 0 OID 0)
-- Dependencies: 218
-- Name: TimeStamp_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public."TimeStamp_id_seq"', 3, true);


--
-- TOC entry 3606 (class 2606 OID 17585)
-- Name: GameDailyData GameDailyData_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameDailyData"
    ADD CONSTRAINT "GameDailyData_pkey" PRIMARY KEY (id);


--
-- TOC entry 3589 (class 2606 OID 17509)
-- Name: GameLevel GameLevel_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameLevel"
    ADD CONSTRAINT "GameLevel_pkey" PRIMARY KEY (id);


--
-- TOC entry 3616 (class 2606 OID 17654)
-- Name: GameSession GameSession_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameSession"
    ADD CONSTRAINT "GameSession_pkey" PRIMARY KEY (id);


--
-- TOC entry 3618 (class 2606 OID 17677)
-- Name: GameSession GameSession_user_level_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameSession"
    ADD CONSTRAINT "GameSession_user_level_unique" UNIQUE (user_id, level_id);


--
-- TOC entry 3614 (class 2606 OID 17638)
-- Name: Order Order_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_pkey" PRIMARY KEY (id);


--
-- TOC entry 3602 (class 2606 OID 17561)
-- Name: Performance Performance_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Performance"
    ADD CONSTRAINT "Performance_pkey" PRIMARY KEY (id);


--
-- TOC entry 3610 (class 2606 OID 17611)
-- Name: Product Product_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Product"
    ADD CONSTRAINT "Product_pkey" PRIMARY KEY (id);


--
-- TOC entry 3620 (class 2606 OID 17664)
-- Name: QuizSubmission QuizSubmission_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizSubmission"
    ADD CONSTRAINT "QuizSubmission_pkey" PRIMARY KEY (id);


--
-- TOC entry 3622 (class 2606 OID 17666)
-- Name: QuizSubmission QuizSubmission_userId_levelId_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizSubmission"
    ADD CONSTRAINT "QuizSubmission_userId_levelId_key" UNIQUE ("userId", "levelId");


--
-- TOC entry 3600 (class 2606 OID 17546)
-- Name: Session Session_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_pkey" PRIMARY KEY (id);


--
-- TOC entry 3612 (class 2606 OID 17618)
-- Name: SupplierProduct SupplierProduct_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierProduct"
    ADD CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY (supplier_id, product_id);


--
-- TOC entry 3608 (class 2606 OID 17602)
-- Name: Supplier Supplier_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Supplier"
    ADD CONSTRAINT "Supplier_pkey" PRIMARY KEY (id);


--
-- TOC entry 3591 (class 2606 OID 17518)
-- Name: TimeStamp TimeStamp_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimeStamp"
    ADD CONSTRAINT "TimeStamp_pkey" PRIMARY KEY (id);


--
-- TOC entry 3594 (class 2606 OID 17536)
-- Name: User User_email_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_email_key" UNIQUE (email);


--
-- TOC entry 3596 (class 2606 OID 17534)
-- Name: User User_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY (id);


--
-- TOC entry 3598 (class 2606 OID 17538)
-- Name: User User_username_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."User"
    ADD CONSTRAINT "User_username_key" UNIQUE (username);


--
-- TOC entry 3603 (class 1259 OID 17592)
-- Name: idx_performance_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_level ON public."Performance" USING btree ("levelId");


--
-- TOC entry 3604 (class 1259 OID 17591)
-- Name: idx_performance_user; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_performance_user ON public."Performance" USING btree ("userId");


--
-- TOC entry 3623 (class 1259 OID 17673)
-- Name: idx_quiz_submission_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_submission_level ON public."QuizSubmission" USING btree ("levelId");


--
-- TOC entry 3624 (class 1259 OID 17672)
-- Name: idx_quiz_submission_user_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_quiz_submission_user_level ON public."QuizSubmission" USING btree ("userId", "levelId");


--
-- TOC entry 3592 (class 1259 OID 17593)
-- Name: idx_timestamp_level; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_timestamp_level ON public."TimeStamp" USING btree ("levelId");


--
-- TOC entry 3630 (class 2606 OID 17586)
-- Name: GameDailyData GameDailyData_performanceId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."GameDailyData"
    ADD CONSTRAINT "GameDailyData_performanceId_fkey" FOREIGN KEY ("performanceId") REFERENCES public."Performance"(id) ON DELETE CASCADE;


--
-- TOC entry 3633 (class 2606 OID 17639)
-- Name: Order Order_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Order"
    ADD CONSTRAINT "Order_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id);


--
-- TOC entry 3627 (class 2606 OID 17567)
-- Name: Performance Performance_levelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Performance"
    ADD CONSTRAINT "Performance_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES public."GameLevel"(id);


--
-- TOC entry 3628 (class 2606 OID 17572)
-- Name: Performance Performance_timestampId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Performance"
    ADD CONSTRAINT "Performance_timestampId_fkey" FOREIGN KEY ("timestampId") REFERENCES public."TimeStamp"(id);


--
-- TOC entry 3629 (class 2606 OID 17562)
-- Name: Performance Performance_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Performance"
    ADD CONSTRAINT "Performance_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id);


--
-- TOC entry 3634 (class 2606 OID 17667)
-- Name: QuizSubmission QuizSubmission_userId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."QuizSubmission"
    ADD CONSTRAINT "QuizSubmission_userId_fkey" FOREIGN KEY ("userId") REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- TOC entry 3626 (class 2606 OID 17547)
-- Name: Session Session_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."Session"
    ADD CONSTRAINT "Session_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public."User"(id) ON DELETE CASCADE;


--
-- TOC entry 3631 (class 2606 OID 17624)
-- Name: SupplierProduct SupplierProduct_product_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierProduct"
    ADD CONSTRAINT "SupplierProduct_product_id_fkey" FOREIGN KEY (product_id) REFERENCES public."Product"(id);


--
-- TOC entry 3632 (class 2606 OID 17619)
-- Name: SupplierProduct SupplierProduct_supplier_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."SupplierProduct"
    ADD CONSTRAINT "SupplierProduct_supplier_id_fkey" FOREIGN KEY (supplier_id) REFERENCES public."Supplier"(id);


--
-- TOC entry 3625 (class 2606 OID 17519)
-- Name: TimeStamp TimeStamp_levelId_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public."TimeStamp"
    ADD CONSTRAINT "TimeStamp_levelId_fkey" FOREIGN KEY ("levelId") REFERENCES public."GameLevel"(id);


-- Completed on 2025-08-16 14:21:51 CEST

--
-- PostgreSQL database dump complete
--

