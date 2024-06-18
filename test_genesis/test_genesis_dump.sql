--
-- PostgreSQL database dump
--

-- Dumped from database version 14.2
-- Dumped by pg_dump version 14.2

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: book_status_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.book_status_enum AS ENUM (
    'draft',
    'review',
    'published',
    'archived'
);


ALTER TYPE public.book_status_enum OWNER TO postgres;

--
-- Name: user_role_enum; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public.user_role_enum AS ENUM (
    'admin',
    'editor',
    'author',
    'user'
);


ALTER TYPE public.user_role_enum OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: book; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book (
    id integer NOT NULL,
    title character varying(255) NOT NULL,
    description text NOT NULL,
    content text NOT NULL,
    status public.book_status_enum DEFAULT 'draft'::public.book_status_enum NOT NULL,
    "publicationYear" integer,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.book OWNER TO postgres;

--
-- Name: book_authors_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_authors_user (
    "bookId" integer NOT NULL,
    "userId" integer NOT NULL
);


ALTER TABLE public.book_authors_user OWNER TO postgres;

--
-- Name: book_genres_genre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.book_genres_genre (
    "bookId" integer NOT NULL,
    "genreId" integer NOT NULL
);


ALTER TABLE public.book_genres_genre OWNER TO postgres;

--
-- Name: book_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.book_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.book_id_seq OWNER TO postgres;

--
-- Name: book_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.book_id_seq OWNED BY public.book.id;


--
-- Name: genre; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.genre (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public.genre OWNER TO postgres;

--
-- Name: genre_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.genre_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.genre_id_seq OWNER TO postgres;

--
-- Name: genre_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.genre_id_seq OWNED BY public.genre.id;


--
-- Name: user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public."user" (
    id integer NOT NULL,
    username character varying(255) NOT NULL,
    email character varying(100) NOT NULL,
    password character varying(255) NOT NULL,
    role public.user_role_enum DEFAULT 'user'::public.user_role_enum NOT NULL,
    "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
    "updatedAt" timestamp without time zone DEFAULT now() NOT NULL
);


ALTER TABLE public."user" OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.user_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER TABLE public.user_id_seq OWNER TO postgres;

--
-- Name: user_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.user_id_seq OWNED BY public."user".id;


--
-- Name: book id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book ALTER COLUMN id SET DEFAULT nextval('public.book_id_seq'::regclass);


--
-- Name: genre id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genre ALTER COLUMN id SET DEFAULT nextval('public.genre_id_seq'::regclass);


--
-- Name: user id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user" ALTER COLUMN id SET DEFAULT nextval('public.user_id_seq'::regclass);


--
-- Data for Name: book; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book (id, title, description, content, status, "publicationYear", "createdAt", "updatedAt") FROM stdin;
1	My  book cool title3	My  book cool description	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	draft	\N	2024-05-31 17:22:33.398535	2024-05-31 17:22:33.398535
3	My  book cool title4	My  book cool description	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	draft	\N	2024-05-31 17:28:36.112241	2024-05-31 17:28:36.112241
4	My  book cool title5	My  book cool description	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	draft	\N	2024-05-31 17:28:45.667978	2024-05-31 17:28:45.667978
5	My  book cool title5	My  book cool description	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	draft	\N	2024-05-31 19:20:53.23015	2024-05-31 19:20:53.23015
2	My  book cool title3	My  book cool description	Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.	draft	2024	2024-05-31 17:22:48.669641	2024-05-31 19:33:50.945917
\.


--
-- Data for Name: book_authors_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_authors_user ("bookId", "userId") FROM stdin;
\.


--
-- Data for Name: book_genres_genre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.book_genres_genre ("bookId", "genreId") FROM stdin;
1	1
2	1
3	1
4	1
5	1
\.


--
-- Data for Name: genre; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.genre (id, name, description, "createdAt", "updatedAt") FROM stdin;
1	Fantasy	\N	2024-05-31 15:42:34.835388	2024-05-31 15:42:34.835388
2	Science Fiction	\N	2024-05-31 15:42:56.282756	2024-05-31 15:42:56.282756
3	Mystery	\N	2024-05-31 15:43:10.762618	2024-05-31 15:43:10.762618
4	Thriller	\N	2024-05-31 15:43:19.545114	2024-05-31 15:43:19.545114
5	Romance	\N	2024-05-31 15:43:27.831663	2024-05-31 15:43:27.831663
6	Historical Fiction	\N	2024-05-31 15:43:35.534471	2024-05-31 15:43:35.534471
7	Horror	\N	2024-05-31 15:43:47.330282	2024-05-31 15:43:47.330282
8	Adventure	\N	2024-05-31 15:43:57.672899	2024-05-31 15:43:57.672899
9	Biography	\N	2024-05-31 15:44:11.859449	2024-05-31 15:44:11.859449
10	Autobiography	\N	2024-05-31 15:44:19.22319	2024-05-31 15:44:19.22319
11	Memoir	\N	2024-05-31 15:44:32.595972	2024-05-31 15:44:32.595972
12	Young Adult	\N	2024-05-31 15:44:42.197393	2024-05-31 15:44:42.197393
13	Children's	\N	2024-05-31 15:44:54.944639	2024-05-31 15:44:54.944639
14	Dystopian	\N	2024-05-31 15:45:06.95714	2024-05-31 15:45:06.95714
15	Crime	\N	2024-05-31 15:45:15.701298	2024-05-31 15:45:15.701298
16	Suspense	\N	2024-05-31 15:45:23.602144	2024-05-31 15:45:23.602144
17	Literary Fiction	\N	2024-05-31 15:45:32.425913	2024-05-31 15:45:32.425913
18	Non-Fiction	\N	2024-05-31 15:45:44.57279	2024-05-31 15:45:44.57279
19	Self-Help	\N	2024-05-31 15:45:56.263681	2024-05-31 15:45:56.263681
20	Travel	\N	2024-05-31 15:46:06.540306	2024-05-31 15:46:06.540306
21	Cooking	\N	2024-05-31 15:46:14.307604	2024-05-31 15:46:14.307604
22	Science	\N	2024-05-31 15:46:22.018423	2024-05-31 15:46:22.018423
23	Business	\N	2024-05-31 15:46:30.4925	2024-05-31 15:46:30.4925
24	Philosophy	\N	2024-05-31 15:46:37.864074	2024-05-31 15:46:37.864074
25	Poetry	\N	2024-05-31 15:46:44.851676	2024-05-31 15:46:44.851676
26	Religion/Spirituality	\N	2024-05-31 15:46:56.53209	2024-05-31 15:46:56.53209
27	Art/Photography	\N	2024-05-31 15:47:06.492864	2024-05-31 15:47:06.492864
28	Graphic Novels/Comics	\N	2024-05-31 15:47:21.091388	2024-05-31 15:47:21.091388
29	Historical Non-Fiction	\N	2024-05-31 15:47:33.664477	2024-05-31 15:47:33.664477
30	Psychology	\N	2024-05-31 15:47:45.402687	2024-05-31 15:47:45.402687
31	Manuals	\N	2024-05-31 15:49:32.887799	2024-05-31 15:49:32.887799
32	Computer Science	\N	2024-05-31 15:50:32.544681	2024-05-31 15:50:32.544681
\.


--
-- Data for Name: user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."user" (id, username, email, password, role, "createdAt", "updatedAt") FROM stdin;
\.


--
-- Name: book_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.book_id_seq', 5, true);


--
-- Name: genre_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.genre_id_seq', 32, true);


--
-- Name: user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.user_id_seq', 1, false);


--
-- Name: genre PK_0285d4f1655d080cfcf7d1ab141; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genre
    ADD CONSTRAINT "PK_0285d4f1655d080cfcf7d1ab141" PRIMARY KEY (id);


--
-- Name: book_genres_genre PK_75a197f32ed39286c5c39198ece; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_genres_genre
    ADD CONSTRAINT "PK_75a197f32ed39286c5c39198ece" PRIMARY KEY ("bookId", "genreId");


--
-- Name: book_authors_user PK_977cc65b1d1089769fb370a22f9; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_authors_user
    ADD CONSTRAINT "PK_977cc65b1d1089769fb370a22f9" PRIMARY KEY ("bookId", "userId");


--
-- Name: book PK_a3afef72ec8f80e6e5c310b28a4; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book
    ADD CONSTRAINT "PK_a3afef72ec8f80e6e5c310b28a4" PRIMARY KEY (id);


--
-- Name: user PK_cace4a159ff9f2512dd42373760; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY (id);


--
-- Name: genre UQ_dd8cd9e50dd049656e4be1f7e8c; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.genre
    ADD CONSTRAINT "UQ_dd8cd9e50dd049656e4be1f7e8c" UNIQUE (name);


--
-- Name: user UQ_e12875dfb3b1d92d7d7c5377e22; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public."user"
    ADD CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE (email);


--
-- Name: IDX_31d658e0af554165f4598158c5; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_31d658e0af554165f4598158c5" ON public.book_genres_genre USING btree ("bookId");


--
-- Name: IDX_7775ae6ef3e1a4e3c1e391e795; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_7775ae6ef3e1a4e3c1e391e795" ON public.book_authors_user USING btree ("bookId");


--
-- Name: IDX_83bd32782d44d9db3d68c3f58c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_83bd32782d44d9db3d68c3f58c" ON public.book_genres_genre USING btree ("genreId");


--
-- Name: IDX_a23e4baaae1294f8b16a916894; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_a23e4baaae1294f8b16a916894" ON public.book USING btree ("publicationYear");


--
-- Name: IDX_bce11c9e74388ee6e509a8411a; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_bce11c9e74388ee6e509a8411a" ON public.book_authors_user USING btree ("userId");


--
-- Name: IDX_c10a44a29ef231062f22b1b7ac; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX "IDX_c10a44a29ef231062f22b1b7ac" ON public.book USING btree (title);


--
-- Name: book_genres_genre FK_31d658e0af554165f4598158c55; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_genres_genre
    ADD CONSTRAINT "FK_31d658e0af554165f4598158c55" FOREIGN KEY ("bookId") REFERENCES public.book(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: book_authors_user FK_7775ae6ef3e1a4e3c1e391e7959; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_authors_user
    ADD CONSTRAINT "FK_7775ae6ef3e1a4e3c1e391e7959" FOREIGN KEY ("bookId") REFERENCES public.book(id) ON UPDATE CASCADE ON DELETE CASCADE;


--
-- Name: book_genres_genre FK_83bd32782d44d9db3d68c3f58c1; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_genres_genre
    ADD CONSTRAINT "FK_83bd32782d44d9db3d68c3f58c1" FOREIGN KEY ("genreId") REFERENCES public.genre(id);


--
-- Name: book_authors_user FK_bce11c9e74388ee6e509a8411a7; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.book_authors_user
    ADD CONSTRAINT "FK_bce11c9e74388ee6e509a8411a7" FOREIGN KEY ("userId") REFERENCES public."user"(id);


--
-- PostgreSQL database dump complete
--

